import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { customerService } from '../../services/customerService';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../theme';

const CreateCustomerScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    segment: 'retail',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.phone) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      await customerService.createCustomer(formData);
      alert('Tạo khách hàng thành công');
      navigation.goBack();
    } catch (error) {
      alert('Tạo khách hàng thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card>
          <Input
            label="Họ và tên *"
            value={formData.fullName}
            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            placeholder="Nhập họ và tên"
          />

          <Input
            label="Số điện thoại *"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />

          <Input
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Nhập email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Địa chỉ"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Nhập địa chỉ"
            multiline
          />

          <Input
            label="Ghi chú"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Ghi chú về khách hàng"
            multiline
          />
        </Card>

        <Button
          title="Tạo khách hàng"
          variant="primary"
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
  },
});

export default CreateCustomerScreen;

