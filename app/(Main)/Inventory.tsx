import { Feather } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import {
  collection, // <-- CORRECTED: Modular SDK type
  DocumentData,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AddProductFlow from "../(Routes)/AddProductFlow";
// Ensure you have the 'auth' and 'db' exports correctly configured in firebaseConfig
import { auth, db } from "../config/firebaseConfig";

// Types
interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  image?: {
    uri: string;
    type?: string;
    fileName?: string;
    fileSize?: number;
  } | null;
  quantityType: string;
  unitsInStock: number;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  expiryDate: string;
  supplier: {
    name: string;
    phone: string;
  };
  dateAdded: string;
  userId: string;
}

type FilterType = "all" | "inStock" | "outOfStock" | "expiring";

interface FilterCounts {
  all: number;
  inStock: number;
  outOfStock: number;
  expiring: number;
}

interface StockStatus {
  text: string;
  color: string;
  bgColor: string;
}

interface FilterItem {
  key: string;
  label: string;
  count: number;
}

const Inventory: React.FC = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddProduct, setShowAddProduct] = useState<boolean>(false);

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../../assets/fonts/Poppins-Light.ttf"),
  });

  const [filterCounts, setFilterCounts] = useState<FilterCounts>({
    all: 0,
    inStock: 0,
    outOfStock: 0,
    expiring: 0,
  });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("ERROR: No authenticated user found");
      setLoading(false);
      // Optionally redirect to login here
      return;
    }

    const productsQuery = query(
      collection(db, "products"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const productsData: Product[] = [];
        snapshot.forEach(
          // CORRECTED TYPE: Use modular SDK's QueryDocumentSnapshot
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            productsData.push({
              id: doc.id,
              ...data,
            } as Product);
          }
        );

        productsData.sort((a, b) => {
          // Assuming dateAdded is an ISO string or comparable value
          const dateA = new Date(a.dateAdded).getTime();
          const dateB = new Date(b.dateAdded).getTime();
          return dateB - dateA;
        });

        setProducts(productsData);
        calculateFilterCounts(productsData);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        Alert.alert(
          "Error Loading Products",
          `There was an issue loading your products: ${error.message}`,
          [{ text: "OK" }]
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const calculateFilterCounts = (productsData: Product[]): void => {
    const now = new Date();
    // Check for expiration within the next 10 days
    const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    const counts: FilterCounts = {
      all: productsData.length,
      inStock: 0,
      outOfStock: 0,
      expiring: 0,
    };

    productsData.forEach((product) => {
      if (product.unitsInStock > 0) {
        counts.inStock++;
      } else {
        counts.outOfStock++;
      }

      if (product.expiryDate) {
        const expiryDate = new Date(product.expiryDate);
        // Expiring: Date is on or before 10 days from now AND is in the future
        if (expiryDate <= tenDaysFromNow && expiryDate > now) {
          counts.expiring++;
        }
      }
    });

    setFilterCounts(counts);
  };

  const performSearch = (query: string): Product[] => {
    if (!query.trim()) {
      return products;
    }
    const searchTerm = query.toLowerCase().trim();
    return products.filter((product) => {
      const name = product.name?.toLowerCase() || "";
      const category = product.category?.toLowerCase() || "";
      const barcode = product.barcode?.toLowerCase() || "";
      const supplier = product.supplier?.name?.toLowerCase() || "";
      return (
        name.includes(searchTerm) ||
        category.includes(searchTerm) ||
        barcode.includes(searchTerm) ||
        supplier.includes(searchTerm)
      );
    });
  };

  useEffect(() => {
    let filtered = [...products];

    // 1. Apply Search Filter first
    if (searchQuery.trim()) {
      filtered = performSearch(searchQuery);
    }

    // 2. Apply Stock Filter
    if (activeFilter === "inStock") {
      filtered = filtered.filter((product) => product.unitsInStock > 0);
    } else if (activeFilter === "outOfStock") {
      filtered = filtered.filter((product) => product.unitsInStock === 0);
    } else if (activeFilter === "expiring") {
      const now = new Date();
      const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((product) => {
        if (!product.expiryDate) return false;
        const expiryDate = new Date(product.expiryDate);
        return expiryDate <= tenDaysFromNow && expiryDate > now;
      });
    }
    setFilteredProducts(filtered);
  }, [products, activeFilter, searchQuery]);

  const handleSearchChange = (text: string): void => {
    setSearchQuery(text);
  };

  const clearSearch = (): void => {
    setSearchQuery("");
  };

  const handleAddProduct = async (productData: Product): Promise<void> => {
    // In a real application, this function would handle the product save
    // to the local 'products' state and Firestore via an API call,
    // and close the modal. Since the useEffect listener handles
    // updating the state from Firestore, we only need a placeholder here
    // until the actual AddProductFlow logic is implemented.
    Alert.alert("Success", "Product added to inventory!");
  };

  const getStockStatus = (product: Product): StockStatus => {
    if (product.unitsInStock === 0) {
      return { text: "Out of Stock", color: "#FF6B6B", bgColor: "#FFE5E5" };
    } else if (product.unitsInStock <= product.lowStockThreshold) {
      // Use lowStockThreshold
      return { text: "Low Stock", color: "#FF8C42", bgColor: "#FFF2E5" };
    } else {
      return { text: "In Stock", color: "#4CAF50", bgColor: "#E8F5E8" };
    }
  };

  const isExpiringSoon = (expiryDate: string): boolean => {
    if (!expiryDate) return false;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 10 && daysUntilExpiry > 0;
  };

  const renderFilterTabs = (): React.ReactElement => {
    const filters: FilterItem[] = [
      {
        key: "all",
        label: `All Products (${filterCounts.all})`,
        count: filterCounts.all,
      },
      {
        key: "inStock",
        label: `In Stock (${filterCounts.inStock})`,
        count: filterCounts.inStock,
      },
      {
        key: "outOfStock",
        label: `Out of Stock (${filterCounts.outOfStock})`,
        count: filterCounts.outOfStock,
      },
      {
        key: "expiring",
        label: `Expiring (${filterCounts.expiring})`,
        count: filterCounts.expiring,
      },
    ];

    return (
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContentContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                activeFilter === filter.key && styles.activeFilterTab,
              ]}
              onPress={() => setActiveFilter(filter.key as FilterType)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.activeFilterText,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderProductCard = (product: Product): React.ReactElement => {
    const stockStatus = getStockStatus(product);
    const expiringSoon = isExpiringSoon(product.expiryDate);

    return (
      <TouchableOpacity
        key={product.id}
        style={styles.productCard}
        onPress={() => {
          router.push({
            pathname: "/(Routes)/ProductDetails" as any,
            params: { productId: product.id },
          });
        }}
      >
        <Image
          source={
            product.image?.uri
              ? { uri: product.image.uri }
              : { uri: "https://via.placeholder.com/120" } // Increased size for better image quality
          }
          style={styles.productImage}
        />

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Expiring Soon Tag (Conditionally rendered) */}
          {expiringSoon && (
            <View
              style={[
                styles.stockTag,
                { backgroundColor: "#FFF2E5", marginBottom: 5 },
              ]}
            >
              <Text
                style={[
                  styles.stockTagText,
                  { color: "#F59E0B", fontWeight: "bold" },
                ]}
              >
                Expiring Soon
              </Text>
            </View>
          )}

          <View style={styles.detailsRow}>
            {/* Left Box (In Stock) */}
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>In stock</Text>
              <View style={styles.stockStatusRow}>
                {stockStatus.text !== "In Stock" ? (
                  <View
                    style={[
                      styles.stockTag,
                      { backgroundColor: stockStatus.bgColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockTagText,
                        { color: stockStatus.color },
                      ]}
                    >
                      {stockStatus.text}
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.stockCount}>{product.unitsInStock}</Text>
              </View>
            </View>

            {/* Right Box (Unit Price) */}
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Unit Price</Text>
              <Text style={styles.price}>
                ₦{product.sellingPrice.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Profit Section */}
          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>Profit/Unit</Text>
            <Text style={styles.profitAmount}>
              ₦{(product.sellingPrice - product.costPrice).toLocaleString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (): React.ReactElement => (
    <View style={styles.emptyState}>
      <Feather name="package" size={80} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Products Yet</Text>
      <Text style={styles.emptyDescription}>
        Start building your inventory by adding your first product
      </Text>
      <TouchableOpacity
        style={styles.addFirstProductButton}
        onPress={() => setShowAddProduct(true)}
      >
        <Text style={styles.addFirstProductButtonText}>
          Add Your First Product
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchEmptyState = (): React.ReactElement => (
    <View style={styles.emptyState}>
      <Feather name="search" size={80} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Products Found</Text>
      <Text style={styles.emptyDescription}>
        Try adjusting your search or filter criteria
      </Text>
      <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
        <Text style={styles.clearSearchText}>Clear Search</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity
          style={styles.newProductButton}
          onPress={() => setShowAddProduct(true)}
        >
          <Text style={styles.newProductButtonText}>New Product</Text>
          <Feather name="plus" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={16} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, or category"
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholderTextColor="#999"
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {/* Filter button is a placeholder, as the actual filtering is done via tabs */}
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="sliders" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      {products.length > 0 && renderFilterTabs()}

      {/* Products List */}
      <ScrollView
        style={styles.productsContainer}
        showsVerticalScrollIndicator={false}
      >
        {products.length === 0 && !loading
          ? renderEmptyState()
          : filteredProducts.length === 0 && searchQuery.length > 0
          ? renderSearchEmptyState()
          : filteredProducts.map((product) => renderProductCard(product))}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Product Modal */}
      <AddProductFlow
        visible={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSaveProduct={handleAddProduct}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#E7EEFA",
  },
  headerTitle: {
    fontSize: 34,
    color: "#000",
    fontFamily: "Poppins-Bold",
  },
  newProductButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  newProductButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#E7EEFA",
    alignItems: "center",
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  filterButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 15,
  },
  filtersContainer: {
    backgroundColor: "#E7EEFA",
    paddingVertical: 10,
  },
  filtersContentContainer: {
    paddingHorizontal: 20,
    alignItems: "flex-start",
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  activeFilterTab: {
    backgroundColor: "#F8F9FA",
    borderColor: "#B5CAEF",
    borderWidth: 1,
  },
  filterText: {
    fontSize: 18,
    fontFamily: "Poppins-Regular",
    fontWeight: "500",
    color: "#000",
  },
  activeFilterText: {
    color: "#000",
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  productCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  detailBox: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E7EEFA",
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontFamily: "Poppins-Regular",
  },
  stockStatusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockTag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  stockTagText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },
  stockCount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    fontFamily: "Poppins-Bold",
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    fontFamily: "Poppins-Bold",
  },
  profitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  profitLabel: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  profitAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
    fontFamily: "Poppins-Regular",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "Poppins-Regular",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 40,
    fontFamily: "Poppins-Regular",
  },
  addFirstProductButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addFirstProductButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },
  clearSearchButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  clearSearchText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Poppins-Regular",
  },
  bottomPadding: {
    height: 20,
  },
});

export default Inventory;
