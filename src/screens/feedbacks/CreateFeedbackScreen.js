import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { customerService } from "../../services/customerService";
import { feedbackService } from "../../services/feedbackService";
import { theme } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/Button";
import { useNavigation } from "@react-navigation/native";

const CreateFeedbackScreen = () => {
  const navigation = useNavigation();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Load customers error:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !content.trim()) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng chọn khách hàng và nhập nội dung"
      );
      return;
    }

    try {
      setSubmitting(true);
      await feedbackService.createFeedback({
        customer: selectedCustomer,
        content: content.trim(),
      });
      Alert.alert("Thành công", "Gửi phản hồi thành công!");
      navigation.goBack();
    } catch (error) {
      console.error("Create feedback error:", error);
      Alert.alert("Lỗi", "Không thể gửi phản hồi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Đang tải danh sách khách hàng...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* 🔹 Header có nút Back */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Tạo phản hồi mới</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* 🔹 Chọn khách hàng */}
        <Text style={styles.label}>Khách hàng</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={styles.dropdownText}>
            {selectedCustomer
              ? customers.find((c) => c._id === selectedCustomer)?.fullName
              : "Chọn khách hàng"}
          </Text>
          <Ionicons
            name={showDropdown ? "chevron-up" : "chevron-down"}
            size={18}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        {showDropdown && (
          <View style={styles.dropdownList}>
            {customers.map((c) => (
              <TouchableOpacity
                key={c._id}
                style={[
                  styles.dropdownItem,
                  selectedCustomer === c._id && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  setSelectedCustomer(c._id);
                  setShowDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    selectedCustomer === c._id &&
                      styles.dropdownItemTextSelected,
                  ]}
                >
                  {c.fullName} - {c.phone}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 🔹 Nội dung phản hồi */}
        <Text style={styles.label}>Nội dung phản hồi</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Nhập nội dung phản hồi..."
          multiline
          numberOfLines={5}
          value={content}
          onChangeText={setContent}
        />

        {/* 🔹 Nút gửi */}
        <Button
          title={submitting ? "Đang gửi..." : "Gửi phản hồi"}
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          disabled={submitting}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    padding: 6,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    marginBottom: theme.spacing.sm,
  },
  dropdownText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundLight,
    marginBottom: theme.spacing.md,
  },
  dropdownItem: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  dropdownItemText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
  },
  dropdownItemTextSelected: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    textAlignVertical: "top",
    fontSize: theme.typography.fontSize.base,
    backgroundColor: theme.colors.backgroundLight,
    marginBottom: theme.spacing.xl,
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
});

export default CreateFeedbackScreen;
