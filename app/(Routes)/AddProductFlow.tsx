import { Ionicons } from "@expo/vector-icons";
// CORRECTED: Using modular SDK imports (assumes Firebase is set up correctly for Expo/web)
import { addDoc, collection } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Asset,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
  MediaType,
} from "react-native-image-picker";
import { auth, db, storage } from "../config/firebaseConfig";

const { width } = Dimensions.get("window");

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

interface AddProductFlowProps {
  visible: boolean;
  onClose: () => void;
  onSaveProduct: (productData: Product) => void;
}

interface FormData {
  productName: string;
  sku: string;
  category: string;
  productImage: {
    uri: string;
    type?: string;
    fileName?: string;
  } | null;
  quantityType: string;
  numberOfItems: string;
  costPrice: string;
  sellingPrice: string;
  lowStockThreshold: string;
  expiryDate: {
    day: string;
    month: string;
    year: string;
  };
  supplier: {
    name: string;
    phone: string;
  };
}

interface ImageAsset {
  uri: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

// Main Component
const AddProductFlow: React.FC<AddProductFlowProps> = ({
  visible,
  onClose,
  onSaveProduct,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0.33);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    productName: "",
    sku: "",
    category: "",
    productImage: null,
    quantityType: "Single Items",
    numberOfItems: "",
    costPrice: "",
    sellingPrice: "",
    lowStockThreshold: "",
    expiryDate: {
      day: "",
      month: "",
      year: "",
    },
    supplier: {
      name: "",
      phone: "",
    },
  });

  const [showScanner, setShowScanner] = useState(false);

  const steps = ["Product Info", "Pricing & Packaging", "Stock & Extras"];

  // Check if user is authenticated
  const currentUser = auth.currentUser;

  // Update progress based on filled fields
  useEffect(() => {
    const calculateProgress = () => {
      let filledFields = 0;
      let totalFields = 0;

      if (currentStep === 0) {
        totalFields = 4;
        if (formData.productName) filledFields++;
        if (formData.sku) filledFields++;
        // NOTE: Category is hardcoded to "Food" on press, but we'll check if a value exists
        if (formData.category) filledFields++;
        if (formData.productImage) filledFields++;
      } else if (currentStep === 1) {
        totalFields = 4;
        // quantityType defaults to "Single Items"
        if (formData.quantityType) filledFields++;
        if (formData.numberOfItems) filledFields++;
        if (formData.costPrice) filledFields++;
        if (formData.sellingPrice) filledFields++;
      } else if (currentStep === 2) {
        totalFields = 5;
        if (formData.lowStockThreshold) filledFields++;
        if (formData.expiryDate.month && formData.expiryDate.year)
          filledFields++;
        if (formData.supplier.name) filledFields++;
        if (formData.supplier.phone) filledFields++;
        filledFields++; // Always count this step as having some progress
      }

      const stepProgress = filledFields / totalFields;
      // Calculate overall progress based on steps
      const baseProgress = currentStep * 0.33;
      const currentProgress = baseProgress + stepProgress * 0.33;
      // Ensure progress doesn't exceed 1 (100%)
      setProgress(Math.min(currentProgress, 1));
    };

    calculateProgress();
  }, [formData, currentStep]);

  const updateFormData = (field: string, value: string | ImageAsset | null) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormData] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleBarcodeScan = (data: string) => {
    updateFormData("sku", data);
    setShowScanner(false);
    Alert.alert("Success", "Barcode scanned successfully!");
  };

  const uploadImage = async (uri: string): Promise<string> => {
    setImageUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated.");
      }
      const fileRef = ref(storage, `product_images/${user.uid}/${Date.now()}`);
      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error("Image upload error:", error);
      Alert.alert("Error", "Failed to upload image.");
      throw error;
    } finally {
      setImageUploading(false);
    }
  };

  const handlePickImage = async (useCamera: boolean) => {
    // Request camera permissions on Android
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "The app needs camera access to take pictures.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          "Permission Denied",
          "You need to grant camera permission to use this feature."
        );
        return;
      }
    }

    const options = {
      mediaType: "photo" as MediaType,
      includeBase64: false,
    };

    try {
      let response: ImagePickerResponse;
      if (useCamera) {
        response = await launchCamera(options);
      } else {
        response = await launchImageLibrary(options);
      }

      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorCode) {
        console.log("Image picker error: ", response.errorCode);
        Alert.alert(
          "Error",
          response.errorMessage || "An unknown error occurred."
        );
      } else if (response.assets && response.assets.length > 0) {
        const asset: Asset = response.assets[0];
        if (asset.uri) {
          updateFormData("productImage", {
            uri: asset.uri,
            type: asset.type,
            fileName: asset.fileName,
          });
        }
      }
    } catch (error) {
      console.log("Caught an unexpected error:", error);
      Alert.alert(
        "Unexpected Error",
        "An unexpected error occurred while picking an image."
      );
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      "Select Product Image",
      "Choose how you would like to upload a new photo.",
      [
        {
          text: "Take Photo",
          onPress: () => handlePickImage(true),
        },
        {
          text: "Choose from Gallery",
          onPress: () => handlePickImage(false),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const nextStep = () => {
    // Basic validation before moving to the next step
    if (currentStep === 0) {
      if (
        !formData.productName ||
        !formData.sku ||
        !formData.category ||
        !formData.productImage
      ) {
        Alert.alert(
          "Missing Information",
          "Please fill in all required fields and upload an image for Product Info."
        );
        return;
      }
    } else if (currentStep === 1) {
      if (
        !formData.numberOfItems ||
        !formData.costPrice ||
        !formData.sellingPrice
      ) {
        Alert.alert(
          "Missing Information",
          "Please fill in all required fields for Pricing & Packaging."
        );
        return;
      }
    }

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      // Show summary
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setFormData({
      productName: "",
      sku: "",
      category: "",
      productImage: null,
      quantityType: "Single Items",
      numberOfItems: "",
      costPrice: "",
      sellingPrice: "",
      lowStockThreshold: "",
      expiryDate: { day: "", month: "", year: "" },
      supplier: { name: "", phone: "" },
    });
  };

  const handleSaveProduct = async () => {
    // Check if user is authenticated
    if (!currentUser) {
      Alert.alert("Authentication Error", "Please log in to add products.");
      return;
    }

    // Prevent double-tap
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      let imageUrl = null;
      if (formData.productImage) {
        imageUrl = await uploadImage(formData.productImage.uri);
      }

      // Prepare product data for Firestore
      const productData = {
        name: formData.productName || "Untitled Product",
        category: formData.category || "Food",
        barcode: formData.sku || "",
        image: imageUrl ? { uri: imageUrl } : null,
        quantityType: formData.quantityType || "Single Items",
        unitsInStock: parseInt(formData.numberOfItems) || 0,
        costPrice: parseFloat(formData.costPrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        expiryDate:
          formData.expiryDate.month && formData.expiryDate.year
            ? `${formData.expiryDate.month}/${
                formData.expiryDate.day || "01"
              }/${formData.expiryDate.year}`
            : "12/01/2025",
        supplier: {
          name: formData.supplier.name || "Gideon Otuedor",
          phone: formData.supplier.phone || "+234 123 4567 890",
        },
        dateAdded: new Date().toISOString(),
        userId: currentUser.uid,
      };

      console.log("Saving product with userId:", currentUser.uid);

      // Save to Firestore
      // Using modular SDK: collection(db, "products")
      const docRef = await addDoc(collection(db, "products"), productData);
      console.log("Product saved with ID:", docRef.id);

      // Create the product object with the generated ID for the callback
      const savedProduct: Product = {
        id: docRef.id,
        ...productData,
      } as Product; // Cast to ensure it matches the interface

      // Call the parent callback
      onSaveProduct(savedProduct);

      // Close modal and reset form
      // Note: onClose is called before resetForm to ensure modal state is clean
      onClose();
      resetForm();

      // Alert moved to parent Inventory.tsx for better UX consistency after Firestore update
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert(
        "Error",
        "Failed to add product. Please check your connection and try again."
      );
    } finally {
      // Ensure saving state is reset, even if an error occurred
      setSaving(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepContainer}>
          <View
            style={[
              styles.stepIndicator,
              {
                backgroundColor: index <= currentStep ? "#007AFF" : "#E0E0E0",
                width:
                  index === 0
                    ? width * 0.25
                    : index === 1
                    ? width * 0.35
                    : width * 0.25,
              },
            ]}
          >
            {index === currentStep && (
              // Only render progress fill for the current active step
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            )}
            {index < currentStep && (
              // Fill completed steps completely
              <View style={[styles.progressFill, { width: "100%" }]} />
            )}
          </View>
          <Text
            style={[
              styles.stepText,
              { color: index <= currentStep ? "#007AFF" : "#999" },
            ]}
          >
            {step}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Product Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Type here..."
          value={formData.productName}
          onChangeText={(value) => updateFormData("productName", value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          SKU / Barcode <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputWithButton}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 10 }]}
            placeholder="Type 8-13 digits here..."
            value={formData.sku}
            onChangeText={(value) => updateFormData("sku", value)}
            keyboardType="numeric"
          />
          {/* Barcode scanner placeholder */}
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setShowScanner(true)}
          >
            <Ionicons name="barcode" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Product Category <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdown}
          // Defaulting category to a value for demonstration
          onPress={() => updateFormData("category", "Food")}
        >
          <Text
            style={
              formData.category
                ? styles.dropdownText
                : styles.dropdownPlaceholder
            }
          >
            {formData.category || "Select Category (e.g., Food)"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Upload Product Image <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          onPress={showImagePickerOptions}
          style={styles.imageUploadContainer}
          disabled={imageUploading}
        >
          {formData.productImage ? (
            <View style={styles.uploadedImageContainer}>
              <Image
                source={{ uri: formData.productImage.uri }}
                style={styles.uploadedImage}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => updateFormData("productImage", null)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageUploadArea}>
              <Text style={styles.imageUploadIcon}>📷</Text>
              <Text style={styles.imageUploadText}>
                Tap to take a picture, or select from gallery
              </Text>
              {imageUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={{ color: "#fff", marginTop: 5 }}>
                    Uploading...
                  </Text>
                </View>
              )}
              <Text style={styles.imageUploadInfo}>
                Files Supported: PNG, JPG, SVG.
              </Text>
              <Text style={styles.imageUploadInfo}>Maximum Size 1MB</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Quantity Type: <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.radioGroup}>
          {["Single Items", "Carton", "Both"].map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.radioOption}
              onPress={() => updateFormData("quantityType", type)}
            >
              <View
                style={[
                  styles.radioCircle,
                  {
                    backgroundColor:
                      formData.quantityType === type ? "#007AFF" : "#FFF",
                  },
                ]}
              >
                {formData.quantityType === type && (
                  <View style={styles.radioInner} />
                )}
              </View>
              {/* CORRECTED: Wrapping text in a <Text> component */}
              <Text style={styles.radioText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          No. of Items (Unit) <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="How many pieces dey inside one carton?"
          value={formData.numberOfItems}
          onChangeText={(value) => updateFormData("numberOfItems", value)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Cost Price (How much you buy am?){" "}
          <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.priceInput}>
          <Text style={styles.currency}>₦</Text>
          <TextInput
            style={styles.priceTextInput}
            placeholder="0.00"
            value={formData.costPrice}
            onChangeText={(value) => updateFormData("costPrice", value)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.priceOptions}>
          <TouchableOpacity
            style={styles.priceOption}
            onPress={() => updateFormData("costPrice", "100")}
          >
            <Text style={styles.priceOptionText}>₦100</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.priceOption}
            onPress={() => updateFormData("costPrice", "200")}
          >
            <Text style={styles.priceOptionText}>₦200</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.priceOption}
            onPress={() => updateFormData("costPrice", "500")}
          >
            <Text style={styles.priceOptionText}>₦500</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.priceOption}
            onPress={() => updateFormData("costPrice", "800")}
          >
            <Text style={styles.priceOptionText}>₦800</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.priceOption}
            onPress={() => updateFormData("costPrice", "1000")}
          >
            <Text style={styles.priceOptionText}>₦1000</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Selling Price (How much you won sell am?){" "}
          <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.priceInput}>
          <Text style={styles.currency}>₦</Text>
          <TextInput
            style={styles.priceTextInput}
            placeholder="0.00"
            value={formData.sellingPrice}
            onChangeText={(value) => updateFormData("sellingPrice", value)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.priceOptions}>
          <TouchableOpacity
            style={styles.priceOption}
            onPress={() => updateFormData("sellingPrice", "100")}
          >
            <Text style={styles.priceOptionText}>₦100</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.priceOption}
            onPress={() => updateFormData("sellingPrice", "200")}
          >
            <Text style={styles.priceOptionText}>₦200</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.priceOption}
            onPress={() => updateFormData("sellingPrice", "500")}
          >
            <Text style={styles.priceOptionText}>₦500</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.priceOption}
            onPress={() => updateFormData("sellingPrice", "800")}
          >
            <Text style={styles.priceOptionText}>₦800</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.priceOption}
            onPress={() => updateFormData("sellingPrice", "1000")}
          >
            <Text style={styles.priceOptionText}>₦1000</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Low stock Threshold <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter threshold number"
          value={formData.lowStockThreshold}
          onChangeText={(value) => updateFormData("lowStockThreshold", value)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Expiry Date</Text>
        <View style={styles.dateInputs}>
          <TextInput
            style={[styles.dateInput, { marginHorizontal: 0, marginRight: 10 }]} // Adjust margins for first input
            placeholder="DD"
            value={formData.expiryDate.day}
            onChangeText={(value) => updateFormData("expiryDate.day", value)}
            keyboardType="numeric"
            maxLength={2}
          />
          <TextInput
            style={styles.dateInput}
            placeholder="MM"
            value={formData.expiryDate.month}
            onChangeText={(value) => updateFormData("expiryDate.month", value)}
            keyboardType="numeric"
            maxLength={2}
          />
          <TextInput
            style={[styles.dateInput, { marginLeft: 10, marginHorizontal: 0 }]} // Adjust margins for last input
            placeholder="YYYY"
            value={formData.expiryDate.year}
            onChangeText={(value) => updateFormData("expiryDate.year", value)}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
      </View>

      <View style={styles.supplierSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Supplier (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name..."
            value={formData.supplier.name}
            onChangeText={(value) => updateFormData("supplier.name", value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Type here..."
            value={formData.supplier.phone}
            onChangeText={(value) => updateFormData("supplier.phone", value)}
            keyboardType="phone-pad"
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderSummary = () => (
    <ScrollView style={styles.summaryContent}>
      <Text style={styles.summaryTitle}>Summary</Text>

      {formData.productImage && (
        <View style={styles.summaryImageContainer}>
          <Image
            source={{ uri: formData.productImage.uri }}
            style={styles.summaryImage}
          />
        </View>
      )}

      <View style={styles.summarySection}>
        <Text style={styles.summaryHeader}>PRODUCT INFO</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Name:</Text>
          <Text style={styles.summaryValue}>{formData.productName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Category:</Text>
          <Text style={styles.summaryValue}>{formData.category || "N/A"}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Barcode:</Text>
          <Text style={styles.summaryValue}>{formData.sku || "N/A"}</Text>
        </View>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryHeader}>QUANTITY & PRICING</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Units in Stock:</Text>
          <Text style={styles.summaryValue}>
            {formData.numberOfItems || "0"}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Unit Type:</Text>
          <Text style={styles.summaryValue}>{formData.quantityType}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Cost Price:</Text>
          <Text style={styles.summaryValue}>
            ₦{formData.costPrice || "0.00"}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Selling Price:</Text>
          <Text style={styles.summaryValue}>
            ₦{formData.sellingPrice || "0.00"}
          </Text>
        </View>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryHeader}>STOCK SETTINGS</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Low Stock Threshold:</Text>
          <Text style={styles.summaryValue}>
            {formData.lowStockThreshold || "10"}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Expiry Date:</Text>
          <Text style={styles.summaryValue}>
            {formData.expiryDate.month && formData.expiryDate.year
              ? `${formData.expiryDate.month}/${
                  formData.expiryDate.day || "01"
                }/${formData.expiryDate.year}`
              : "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryHeader}>SUPPLIER INFO</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Name:</Text>
          <Text style={styles.summaryValue}>
            {formData.supplier.name || "N/A"}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Phone no:</Text>
          <Text style={styles.summaryValue}>
            {formData.supplier.phone || "N/A"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.saveProductButton,
          (saving || imageUploading) && { opacity: 0.7 },
        ]}
        onPress={handleSaveProduct}
        disabled={saving || imageUploading}
      >
        {saving || imageUploading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.saveProductButtonText}>Save Product ✓</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  // Check authentication before rendering
  if (!currentUser) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={styles.errorText}>Please log in to add products</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Product</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        {currentStep < 3 && renderProgressBar()}

        {/* Content */}
        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep2()}
        {currentStep === 2 && renderStep3()}
        {currentStep === 3 && renderSummary()}

        {/* Navigation Buttons */}
        {currentStep < 3 && (
          <View style={styles.navigationButtons}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={prevStep}
                disabled={saving || imageUploading}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.nextButton,
                (saving || imageUploading) && { opacity: 0.7 },
              ]}
              onPress={nextStep}
              disabled={saving || imageUploading}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === 2 ? "Confirm" : "Next"} →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Barcode Scanner Modal (Placeholder) */}
        <Modal visible={showScanner} transparent animationType="slide">
          <View style={styles.imagePickerModal}>
            <View style={styles.imagePickerContent}>
              <Text style={styles.imagePickerTitle}>Barcode Scanner</Text>
              <Text style={styles.imagePickerOptionText}>
                [Barcode scanner component goes here]
              </Text>
              {/* This is where you would place your BarcodeScanner component */}
              {/* For example: <BarcodeScanner onScan={handleBarcodeScan} /> */}
              <TouchableOpacity
                style={styles.imagePickerCancel}
                onPress={() => setShowScanner(false)}
              >
                <Text style={styles.imagePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Loading Overlay */}
        {(saving || imageUploading) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2046AE" />
            <Text style={styles.loadingText}>
              {imageUploading ? "Uploading image..." : "Saving product..."}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  closeButton: {
    padding: 5,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 18,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
  },
  stepIndicator: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
    backgroundColor: "#E0E0E0", // Default color
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    fontWeight: "500",
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  required: {
    color: "#FF3B30",
  },
  input: {
    backgroundColor: "#F0F4F8",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "#000",
  },
  inputWithButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  scanButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  dropdown: {
    backgroundColor: "#F0F4F8",
    borderRadius: 8,
    padding: 15,
  },
  dropdownText: {
    fontSize: 16,
    color: "#000",
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: "#999",
  },
  imageUploadContainer: {
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
  },
  uploadedImageContainer: {
    alignItems: "center",
  },
  uploadedImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  removeButton: {
    borderWidth: 1,
    borderColor: "#FF3B30",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  removeButtonText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "500",
  },
  imageUploadArea: {
    alignItems: "center",
  },
  imageUploadIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  imageUploadText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  takePictureButton: {
    backgroundColor: "#F0F4F8",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 10,
  },
  takePictureButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  galleryLink: {
    color: "#007AFF",
    fontSize: 14,
    textDecorationLine: "underline",
    marginBottom: 15,
  },
  imageUploadInfo: {
    fontSize: 12,
    color: "#999",
    marginBottom: 5,
  },
  orSection: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    width: "100%",
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  orText: {
    marginHorizontal: 10,
    color: "#999",
    fontSize: 12,
  },
  searchOnlineButton: {
    backgroundColor: "#F0F4F8",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchOnlineText: {
    color: "#666",
    fontSize: 14,
  },
  radioGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#007AFF",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  radioText: {
    fontSize: 14,
    color: "#000",
  },
  priceInput: {
    flexDirection: "row",
    backgroundColor: "#F0F4F8",
    borderRadius: 8,
    alignItems: "center",
    paddingLeft: 15,
    marginBottom: 15,
  },
  currency: {
    fontSize: 16,
    color: "#666",
    marginRight: 5,
  },
  priceTextInput: {
    flex: 1,
    padding: 15,
    paddingLeft: 0,
    fontSize: 16,
    color: "#000",
  },
  priceOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  priceOption: {
    backgroundColor: "#F0F4F8",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  priceOptionText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  dateInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -5,
  },
  dateInput: {
    backgroundColor: "#F0F4F8",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "#000",
    flex: 1,
    marginHorizontal: 5,
    textAlign: "center",
  },
  supplierSection: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  backButton: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 30,
    paddingVertical: 15,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  nextButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 30,
    paddingVertical: 15,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  nextButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
  },
  // Summary Styles
  summaryContent: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    padding: 20,
    paddingBottom: 10,
  },
  summaryImageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  summaryImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  summarySection: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 20,
  },
  summaryHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  saveProductButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 18,
    alignItems: "center",
  },
  saveProductButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
  },
  // Image Picker Modal Styles
  imagePickerModal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  imagePickerContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  imagePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    color: "#000",
  },
  imagePickerOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  imagePickerOptionText: {
    fontSize: 16,
    color: "#007AFF",
    textAlign: "center",
  },
  imagePickerCancel: {
    paddingVertical: 15,
    marginTop: 10,
  },
  imagePickerCancelText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    fontWeight: "500",
  },
  // Loading Overlay
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    color: "#2046AE",
    fontWeight: "500",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AddProductFlow;
