type PanditGallerySource = {
  profileImage?: string | null;
  panditCertificateImage?: string | null;
  galleryPhotos?: string[] | null;
};

export function getPanditGalleryPhotos(profile: PanditGallerySource): string[] {
  if (profile.galleryPhotos?.length) {
    return profile.galleryPhotos.filter(Boolean);
  }

  const urls: string[] = [];
  const add = (url?: string | null) => {
    const trimmed = url?.trim();
    if (trimmed && !urls.includes(trimmed)) urls.push(trimmed);
  };

  add(profile.profileImage);
  add(profile.panditCertificateImage);
  return urls;
}
