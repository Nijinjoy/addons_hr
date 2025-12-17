import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApi } from './axiosInstance';
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

export const getProfile = async (companyUrl?: string): Promise<ProfileResult> => {
  await bootstrapCompany(companyUrl);
  return fetchProfileDetails();
};

export const updateProfileImage = async (
  companyUrl: string,
  file: FileUpload
): Promise<ProfileResult> => {
  await bootstrapCompany(companyUrl);
  return uploadImage(file);
};

export const removeProfileImage = async (companyUrl: string): Promise<ProfileResult> => {
  await bootstrapCompany(companyUrl);
  return clearImage();
};

export const setProfileImageUrl = async (
  companyUrl: string,
  imageUrl: string
): Promise<ProfileResult> => {
  await bootstrapCompany(companyUrl);
  return setImage(imageUrl);
};

export type { ProfileData, ProfileResult, FileUpload };
