// app/(Main)/Profile.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
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
import { auth, db, storage } from "../config/firebaseConfig";

const Profile = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(
    "https://via.placeholder.com/150"
  );
  const [userName, setUserName] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
  });

  // ✅ Fetch user data when screen loads
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserName(userData.name || "");
            setProfileImage(
              userData.profileImage || "https://via.placeholder.com/150"
            );
          } else {
            // Create doc if it doesn’t exist
            await setDoc(docRef, {
              name: "User",
              profileImage: "https://via.placeholder.com/150",
            });
            setUserName("User");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          Alert.alert("Error", "Could not fetch profile data.");
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  // ✅ Upload image + save to Firestore
  const uploadImage = async (uri: string) => {
    setImageUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated.");

      const fileRef = ref(storage, `profile_pictures/${user.uid}`);
      await uploadBytes(fileRef, blob);

      const downloadURL = await getDownloadURL(fileRef);
      setProfileImage(downloadURL);

      // Update Firestore immediately
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { profileImage: downloadURL });

      Alert.alert("Success", "Profile picture updated successfully.");
    } catch (error) {
      console.error("Image upload error:", error);
      Alert.alert("Error", "Failed to upload image.");
    } finally {
      setImageUploading(false);
    }
  };

  // ✅ Handle picking image
  const handlePickImage = async (useCamera: boolean) => {
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Denied",
        "Permission to access camera or gallery is required!"
      );
      return;
    }

    const pickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 0.7,
    };

    const pickerResult = useCamera
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions);

    if (!pickerResult.canceled) {
      uploadImage(pickerResult.assets[0].uri);
    }
  };

  // ✅ Save name + keep image in Firestore
  const handleSave = async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          name: userName,
          profileImage: profileImage,
        });

        Alert.alert("Success", "Profile details saved!");
        router.back();
      } catch (error) {
        console.error("Error saving profile:", error);
        Alert.alert("Error", "Failed to save profile details.");
      }
    }
    setLoading(false);
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      "Change Profile Picture",
      "How would you like to select a new photo?",
      [
        { text: "Take Photo", onPress: () => handlePickImage(true) },
        { text: "Choose from Gallery", onPress: () => handlePickImage(false) },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        {/* Profile Picture */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={showImagePickerOptions}
            style={styles.profileImageContainer}
          >
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
            {imageUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
            <View style={styles.cameraIconContainer}>
              <Feather name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.imageTip}>Tap to change picture</Text>
        </View>

        {/* Name Input */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={userName}
            onChangeText={setUserName}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC", marginTop: 30 },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#F4F7FC",
    marginBottom: 20,
  },
  backButton: { marginRight: 10, padding: 5 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    fontFamily: "Poppins-Bold",
  },
  profileSection: { alignItems: "center", marginBottom: 30 },
  profileImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: { width: 150, height: 150, borderRadius: 75 },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#F4F7FC",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
  },
  imageTip: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  formSection: { paddingHorizontal: 20, marginBottom: 20 },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    fontFamily: "Poppins-Bold",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontFamily: "Poppins-Regular",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "Poppins-Bold",
  },
});

export default Profile;
