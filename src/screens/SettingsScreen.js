import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/authService';

const SettingsScreen = () => {
  const { user, logout, updateUser } = useAuth();
  const navigation = useNavigation();
  const [profile, setProfile] = useState({
    name: user?.profile?.name || '',
    phone: user?.profile?.phone || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

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
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const userName = user?.profile?.name || user?.email || 'User';

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const result = await authService.updateProfile(profile);
      updateUser(result.user);
      alert('Cập nhật thông tin thành công');
    } catch (error) {
      alert('Cập nhật thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Mật khẩu mới không khớp');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      alert('Đổi mật khẩu thành công');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      alert('Đổi mật khẩu thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(userName)}</Text>
              </View>
              <View style={styles.onlineIndicator} />
            </View>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="briefcase-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.roleText}>
                {user?.role === 'DealerStaff' ? 'Nhân viên bán hàng' : user?.role || 'User'}
              </Text>
            </View>
          </View>
          </Card>
        </Animated.View>

        {/* Account Settings Section */}
        <Animated.View 
          style={[
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          </View>
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

        {/* Security Section */}
        <Animated.View 
          style={[
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Bảo mật</Text>
          </View>
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
              variant="secondary"
              onPress={handleChangePassword}
              loading={loading}
              fullWidth
              style={styles.saveButton}
            />
          </Card>
        </Animated.View>

        {/* Logout Section */}
        <Animated.View 
          style={[
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <TouchableOpacity
            style={styles.logoutCard}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutContent}>
              <View style={styles.logoutIconContainer}>
                <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
              </View>
              <Text style={styles.logoutText}>Đăng xuất</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['3xl'],
  },
  // Profile Section
  profileCard: {
    marginBottom: theme.spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.md,
  },
  avatarText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textWhite,
  },
  onlineIndicator: {
    position: 'absolute',
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
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs / 2,
  },
  profileEmail: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs / 2,
  },
  roleText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
  },
  // Section Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  saveButton: {
    marginTop: theme.spacing.md,
  },
  // Logout Section
  logoutCard: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.xl,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.error,
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  footerText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textTertiary,
  },
});

export default SettingsScreen;

