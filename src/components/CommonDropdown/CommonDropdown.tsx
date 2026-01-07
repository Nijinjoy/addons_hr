import React, { useMemo, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import DropdownItem from './DropdownItem';

/* 🔹 Dropdown item type */
export interface DropdownData {
  id: number | string;
  label: string;
}

/* 🔹 Props type */
interface CommonDropdownProps {
  data: DropdownData[];
  value?: DropdownData | null;
  onSelect: (item: DropdownData) => void;
  onCreateNew?: () => void;
  createLabel?: string;
  onAdvancedSearch?: () => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  searchEnabled?: boolean;
  searchPlaceholder?: string;
  listMaxHeight?: number;
  nestedScrollEnabled?: boolean;
}

const CommonDropdown: React.FC<CommonDropdownProps> = ({
  data = [],
  value,
  onSelect,
  onCreateNew,
  createLabel,
  onAdvancedSearch,
  onLoadMore,
  loadingMore = false,
  hasMore = false,
  searchEnabled = false,
  searchPlaceholder = 'Search',
  listMaxHeight,
  nestedScrollEnabled = false,
}) => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((d) => String(d.label || '').toLowerCase().includes(q));
  }, [data, query]);

  const renderItem = ({ item }: { item: DropdownData }) => (
    <DropdownItem
      label={item.label}
      selected={value?.id === item.id}
      onPress={() => onSelect(item)}
    />
  );

  const listHeader = (
    <View>
      {onCreateNew && (
        <TouchableOpacity
          style={styles.headerItem}
          onPress={onCreateNew}
        >
          <Text style={styles.headerText}>{createLabel || 'Create new'}</Text>
        </TouchableOpacity>
      )}
      {searchEnabled && (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          style={styles.searchInput}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={nestedScrollEnabled}
        style={listMaxHeight ? { maxHeight: listMaxHeight } : undefined}
        ListHeaderComponent={listHeader}
        ListFooterComponent={
          <>
            {onLoadMore && hasMore && (
              <TouchableOpacity
                style={styles.footerItem}
                onPress={loadingMore ? undefined : onLoadMore}
                disabled={loadingMore}
              >
                <Text style={styles.footerText}>
                  {loadingMore ? 'Loading more...' : 'Load more'}
                </Text>
              </TouchableOpacity>
            )}
            {onAdvancedSearch && (
              <TouchableOpacity
                style={styles.footerItem}
                onPress={onAdvancedSearch}
              >
                <Text style={styles.footerText}>
                  🔍 Advanced search
                </Text>
              </TouchableOpacity>
            )}
          </>
        }
      />
    </View>
  );
};

export default CommonDropdown;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 6,
    fontSize: 14,
    color: '#0F172A',
  },
  headerItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#FFF',
  },
  headerText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  footerItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#FFF',
  },
  footerText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
