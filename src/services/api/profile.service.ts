import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApi } from './axiosInstance';
import { getMethodUrl, getResourceUrl } from '../urlService';
import {
  getProfileDetails as fetchProfileDetails,
  uploadProfileImage as uploadImage,
  deleteProfileImage as clearImage,
  setUserImage as setImage,
  ProfileData,
  ProfileResult,
} from '../profileService';

type FileUpload = { uri: string; name?: string; type?: string };

const persistCompanyUrl = async (companyUrl?: string) => {
  const url = (companyUrl || '').trim();
  if (!url) return;
  try {
    await AsyncStorage.setItem('company_url', url);
  } catch {
    // ignore storage errors
  }
};

const bootstrapCompany = async (companyUrl?: string) => {
  await persistCompanyUrl(companyUrl);
  await createApi(companyUrl);
};

const resolveSiteBase = async (companyUrl?: string) => {
  const candidates = [
    companyUrl,
    await AsyncStorage.getItem('company_url'),
    await getResourceUrl(),
    await getMethodUrl(),
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    const trimmed = c.trim().replace(/\/+$/, '');
    if (!trimmed) continue;
    if (trimmed.endsWith('/api/resource')) return trimmed.replace(/\/api\/resource$/, '');
    if (trimmed.endsWith('/api/method')) return trimmed.replace(/\/api\/method$/, '');
    return trimmed;
  }
  return '';
};

const normalizeProfileImage = async (
  uri?: string | null,
  companyUrl?: string
): Promise<string | null> => {
  if (!uri) return null;
  let cleaned = uri.trim().replace(/^"+|"+$/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('//')) cleaned = `https:${cleaned}`;

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(cleaned);
  const siteBase = await resolveSiteBase(companyUrl);

  if (cleaned.startsWith('/') && siteBase) {
    cleaned = `${siteBase}${cleaned}`;
  } else if (!hasScheme && siteBase) {
    cleaned = `${siteBase}/${cleaned.replace(/^\/+/, '')}`;
  } else if (!hasScheme && !siteBase && cleaned.startsWith('/')) {
    cleaned = `https://${cleaned.replace(/^\/+/, '')}`;
  }

  if (cleaned.includes(' ')) cleaned = encodeURI(cleaned);

  if (cleaned.includes('/private/') && !cleaned.includes('sid=')) {
    try {
      const sid = await AsyncStorage.getItem('sid');
      if (sid) cleaned += (cleaned.includes('?') ? '&' : '?') + `sid=${sid}`;
    } catch {
      // ignore sid lookup errors
    }
  }

  return cleaned;
};

const getCachedProfileImage = async (companyUrl?: string): Promise<string | null> => {
  try {
    const cached = await AsyncStorage.getItem('user_image');
    return await normalizeProfileImage(cached, companyUrl);
  } catch {
    return null;
  }
};

export const getProfile = async (companyUrl?: string): Promise<ProfileResult> => {
  await bootstrapCompany(companyUrl);

  const cachedImage = await getCachedProfileImage(companyUrl);
  const result = await fetchProfileDetails();
  if (!result.ok) return result;

  const normalizedImage =
    (await normalizeProfileImage(result.data?.image, companyUrl)) || cachedImage || result.data?.image;
  const finalImage = normalizedImage || undefined;
  const data: ProfileData = { ...(result.data || {}), image: finalImage };

  if (finalImage) {
    try {
      await AsyncStorage.setItem('user_image', finalImage);
    } catch {
      // ignore cache write failures
    }
  }

  return { ok: true, data };
};

export const updateProfileImage = async (
  companyUrl: string | undefined,
  file: FileUpload
): Promise<ProfileResult> => {
  await bootstrapCompany(companyUrl);
  return uploadImage(file);
};

export const removeProfileImage = async (companyUrl?: string): Promise<ProfileResult> => {
  await bootstrapCompany(companyUrl);
  return clearImage();
};

export const setProfileImageUrl = async (
  companyUrl: string | undefined,
  imageUrl: string
): Promise<ProfileResult> => {
  await bootstrapCompany(companyUrl);
  return setImage(imageUrl);
};

export type { ProfileData, ProfileResult, FileUpload };
