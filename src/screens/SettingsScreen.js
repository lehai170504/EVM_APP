import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../context/AuthContext";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { theme } from "../theme";
import { authService } from "../services/authService";

const SettingsScreen = () => {
  const { user, logout, updateUser } = useAuth();
  const navigation = useNavigation();

  const [profile, setProfile] = useState({
    name: user?.profile?.name || "",
    phone: user?.profile?.phone || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const userName = user?.profile?.name || user?.email || "User";

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const result = await authService.updateProfile(profile);
      updateUser(result.user);
      alert("Cập nhật thông tin thành công");
    } catch (error) {
      alert(
        "Cập nhật thất bại: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Mật khẩu mới không khớp");
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      alert("Đổi mật khẩu thành công");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      alert(
        "Đổi mật khẩu thất bại: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(userName)}</Text>
                </View>
                <View style={styles.onlineIndicator} />
              </View>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.roleBadge}>
                <Ionicons
                  name="briefcase-outline"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text style={styles.roleText}>
                  {user?.role === "DealerStaff"
                    ? "Nhân viên bán hàng"
                    : user?.role || "User"}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Account Info */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          <Card style={styles.sectionCard}>
            <Input
              label="Họ và tên"
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder="Nhập họ và tên"
            />
            <Input
              label="Số điện thoại"
              value={profile.phone}
              onChangeText={(text) => setProfile({ ...profile, phone: text })}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
            />
            <Button
              title="Lưu thông tin"
              variant="primary"
              onPress={handleUpdateProfile}
              loading={loading}
              fullWidth
              style={styles.saveButton}
            />
          </Card>
        </Animated.View>

        {/* Security */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <Text style={styles.sectionTitle}>Bảo mật</Text>
          <Card style={styles.sectionCard}>
            <Input
              label="Mật khẩu hiện tại"
              value={passwordForm.currentPassword}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, currentPassword: text })
              }
              placeholder="Nhập mật khẩu hiện tại"
              secureTextEntry
            />
            <Input
              label="Mật khẩu mới"
              value={passwordForm.newPassword}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, newPassword: text })
              }
              placeholder="Nhập mật khẩu mới"
              secureTextEntry
            />
            <Input
              label="Xác nhận mật khẩu"
              value={passwordForm.confirmPassword}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, confirmPassword: text })
              }
              placeholder="Nhập lại mật khẩu mới"
              secureTextEntry
            />
            <Button
              title="Đổi mật khẩu"
              variant="primary"
              onPress={handleChangePassword}
              loading={loading}
              fullWidth
              style={styles.saveButton}
            />
          </Card>
        </Animated.View>

        {/* Logout */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <TouchableOpacity
            style={styles.logoutCard}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.logoutContent}>
              <View style={styles.logoutIcon}>
                <Ionicons
                  name="log-out-outline"
                  size={24}
                  color={theme.colors.error}
                />
              </View>
              <Text style={styles.logoutText}>Đăng xuất</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textTertiary}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing["3xl"],
  },

  profileCard: { marginBottom: theme.spacing.xl },
  profileHeader: { alignItems: "center", paddingVertical: theme.spacing.xl },
  avatarWrapper: { position: "relative", marginBottom: theme.spacing.md },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadow.md,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#fff" },
  onlineIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.success,
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary + "20",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs / 2,
  },
  roleText: { fontSize: 12, fontWeight: "500", color: theme.colors.primary },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  sectionCard: { marginBottom: theme.spacing.md },
  saveButton: { marginTop: theme.spacing.md },

  logoutCard: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.xl,
    marginVertical: theme.spacing.md,
    ...theme.shadow.card,
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.error + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.error,
  },

  footer: { alignItems: "center", paddingVertical: theme.spacing.xl },
  footerText: { fontSize: 12, color: theme.colors.textTertiary },
});

export default SettingsScreen;
