import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../config/firebaseConfig";

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

interface StockStatus {
  text: string;
  color: string;
  bgColor: string;
}

const ProductDetails: React.FC = () => {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../../assets/fonts/Poppins-Light.ttf"),
  });

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || typeof productId !== "string") {
        console.error("Invalid product ID");
        setLoading(false);
        return;
      }

      try {
        const productDoc = await getDoc(doc(db, "products", productId));

        if (productDoc.exists()) {
          const productData = {
            id: productDoc.id,
            ...productDoc.data(),
          } as Product;

          setProduct(productData);
        } else {
          Alert.alert("Error", "Product not found", [
            { text: "OK", onPress: () => router.back() },
          ]);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        Alert.alert("Error", "Failed to load product details", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Delete product function
  const handleDeleteProduct = async () => {
    if (!product) return;

    setDeleting(true);

    try {
      await deleteDoc(doc(db, "products", product.id));

      Alert.alert("Success", "Product deleted successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error deleting product:", error);
      Alert.alert("Error", "Failed to delete product. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Confirm delete function
  const confirmDelete = () => {
    setShowDeleteModal(true);
  };

  // Get stock status
  const getStockStatus = (product: Product): StockStatus => {
    if (product.unitsInStock === 0) {
      return { text: "Out of Stock", color: "#FF6B6B", bgColor: "#FFE5E5" };
    } else if (product.unitsInStock <= product.lowStockThreshold) {
      return { text: "Low Stock", color: "#FF8C42", bgColor: "#FFF2E5" };
    } else {
      return { text: "In Stock", color: "#4CAF50", bgColor: "#E8F5E8" };
    }
  };

  // Check if product is expiring soon
  const isExpiringSoon = (expiryDate: string): boolean => {
    if (!expiryDate) return false;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string): number => {
    if (!expiryDate) return 0;
    const now = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Render delete confirmation modal
  const renderDeleteModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModal}>
          <View style={styles.deleteModalHeader}>
            <MaterialIcons name="warning" size={32} color="#FF6B6B" />
            <Text style={styles.deleteModalTitle}>Delete Product</Text>
          </View>

          <Text style={styles.deleteModalMessage}>
            Are you sure you want to delete "{product?.name}"? This action
            cannot be undone.
          </Text>

          <View style={styles.deleteModalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, deleting && styles.disabledButton]}
              onPress={handleDeleteProduct}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialIcons name="delete" size={16} color="#FFF" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stockStatus = getStockStatus(product);
  const expiringSoon = isExpiringSoon(product.expiryDate);
  const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity
          style={styles.deleteHeaderButton}
          onPress={confirmDelete}
        >
          <MaterialIcons name="delete" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image and Basic Info */}
        <View style={styles.productImageSection}>
          <View style={styles.imageContainer}>
            <Image
              source={
                product.image?.uri
                  ? { uri: product.image.uri }
                  : { uri: "https://via.placeholder.com/200" }
              }
              style={styles.productImage}
            />
            {expiringSoon && (
              <View style={styles.expiringBadge}>
                <Ionicons name="warning" size={16} color="#FF8C42" />
                <Text style={styles.expiringText}>
                  Expires in {daysUntilExpiry} day
                  {daysUntilExpiry !== 1 ? "s" : ""}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.basicInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productCategory}>{product.category}</Text>

            <View style={styles.stockStatusContainer}>
              <View
                style={[
                  styles.stockBadge,
                  { backgroundColor: stockStatus.bgColor },
                ]}
              >
                <Text
                  style={[styles.stockBadgeText, { color: stockStatus.color }]}
                >
                  {stockStatus.text}
                </Text>
              </View>
              <Text style={styles.stockCount}>
                {product.unitsInStock} {product.quantityType}
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Information</Text>
          <View style={styles.pricingGrid}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Cost Price</Text>
              <Text style={styles.priceValue}>
                ₦{product.costPrice.toLocaleString()}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Selling Price</Text>
              <Text style={styles.priceValue}>
                ₦{product.sellingPrice.toLocaleString()}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Profit per Unit</Text>
              <Text style={[styles.priceValue, styles.profitValue]}>
                ₦{(product.sellingPrice - product.costPrice).toLocaleString()}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Total Value</Text>
              <Text style={styles.priceValue}>
                ₦
                {(product.sellingPrice * product.unitsInStock).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Stock Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Information</Text>
          <View style={styles.stockGrid}>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Current Stock</Text>
              <Text style={styles.stockValue}>
                {product.unitsInStock} {product.quantityType}
              </Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Low Stock Alert</Text>
              <Text style={styles.stockValue}>
                {product.lowStockThreshold} {product.quantityType}
              </Text>
            </View>
          </View>

          {product.unitsInStock <= product.lowStockThreshold && (
            <View style={styles.lowStockAlert}>
              <Ionicons name="warning-outline" size={20} color="#FF8C42" />
              <Text style={styles.lowStockText}>
                Stock is running low! Consider restocking soon.
              </Text>
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Barcode</Text>
              <Text style={styles.detailValue}>{product.barcode}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Quantity Type</Text>
              <Text style={styles.detailValue}>{product.quantityType}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Expiry Date</Text>
              <Text
                style={[
                  styles.detailValue,
                  expiringSoon && styles.expiringDate,
                ]}
              >
                {product.expiryDate
                  ? formatDate(product.expiryDate)
                  : "Not specified"}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date Added</Text>
              <Text style={styles.detailValue}>
                {formatDate(product.dateAdded)}
              </Text>
            </View>
          </View>
        </View>

        {/* Supplier Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supplier Information</Text>
          <View style={styles.supplierInfo}>
            <View style={styles.supplierItem}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <View style={styles.supplierTextContainer}>
                <Text style={styles.supplierLabel}>Supplier Name</Text>
                <Text style={styles.supplierValue}>
                  {product.supplier.name}
                </Text>
              </View>
            </View>
            <View style={styles.supplierItem}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <View style={styles.supplierTextContainer}>
                <Text style={styles.supplierLabel}>Phone Number</Text>
                <Text style={styles.supplierValue}>
                  {product.supplier.phone}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.editButton}>
            <Feather name="edit-2" size={18} color="#007AFF" />
            <Text style={styles.editButtonText}>Edit Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteActionButton}
            onPress={confirmDelete}
          >
            <MaterialIcons name="delete" size={18} color="#FF6B6B" />
            <Text style={styles.deleteActionButtonText}>Delete Product</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Delete Confirmation Modal */}
      {renderDeleteModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7EEFA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#E7EEFA",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#000",
  },
  headerSpacer: {
    width: 40,
  },
  deleteHeaderButton: {
    padding: 8,
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
    fontFamily: "Poppins-Regular",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  content: {
    flex: 1,
  },
  productImageSection: {
    backgroundColor: "#FFF",
    padding: 20,
    marginBottom: 12,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },
  expiringBadge: {
    position: "absolute",
    top: -8,
    right: 60,
    backgroundColor: "#FFF2E5",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#FF8C42",
  },
  expiringText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#FF8C42",
    fontWeight: "600",
  },
  basicInfo: {
    alignItems: "center",
  },
  productName: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 16,
  },
  stockStatusContainer: {
    alignItems: "center",
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  stockBadgeText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    fontWeight: "600",
  },
  stockCount: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#000",
  },
  section: {
    backgroundColor: "#FFF",
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#000",
    marginBottom: 16,
  },
  pricingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  priceItem: {
    width: "48%",
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#000",
  },
  profitValue: {
    color: "#4CAF50",
  },
  stockGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stockItem: {
    flex: 1,
    marginRight: 10,
  },
  stockLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 4,
  },
  stockValue: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#000",
  },
  lowStockAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF2E5",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF8C42",
  },
  lowStockText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#FF8C42",
    marginLeft: 8,
    flex: 1,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#666",
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000",
    flex: 2,
    textAlign: "right",
  },
  expiringDate: {
    color: "#FF8C42",
    fontWeight: "600",
  },
  supplierInfo: {
    gap: 16,
  },
  supplierItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  supplierTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  supplierLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 2,
  },
  supplierValue: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  actionSection: {
    backgroundColor: "#FFF",
    padding: 20,
    marginBottom: 12,
    gap: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F7FF",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#007AFF",
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#007AFF",
    fontWeight: "600",
  },
  deleteActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE5E5",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#FF6B6B",
    gap: 8,
  },
  deleteActionButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#FF6B6B",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  deleteModal: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  deleteModalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#000",
    marginTop: 8,
  },
  deleteModalMessage: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#666",
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#FFF",
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.7,
  },
  bottomPadding: {
    height: 20,
  },
});
export default ProductDetails;
