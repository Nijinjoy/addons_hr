import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';

/* 🔹 Props typing */
interface DropdownItemProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  selected?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}

const DropdownItem: React.FC<DropdownItemProps> = ({
  label,
  onPress,
  selected = false,
  disabled = false,
  icon = null,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        selected && styles.selected,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}

        <Text
          numberOfLines={1}
          style={[
            styles.label,
            selected && styles.selectedText,
            disabled && styles.disabledText,
          ]}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default DropdownItem;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#FFF',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  selected: {
    backgroundColor: '#EAF2FF',
  },
  selectedText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999',
  },
});
