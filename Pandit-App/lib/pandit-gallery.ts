type PanditGallerySource = {
  profileImage?: string | null;
  panditCertificateImage?: string | null;
  galleryPhotos?: string[] | null;
};

export function getPanditGalleryPhotos(profile: PanditGallerySource): string[] {
  const urls: string[] = [];
  const add = (url?: string | null) => {
    const trimmed = url?.trim();
    if (trimmed && !urls.includes(trimmed)) urls.push(trimmed);
  };

  add(profile.profileImage);
  if (profile.galleryPhotos?.length) {
    profile.galleryPhotos.forEach(add);
  }
  add(profile.panditCertificateImage);
  return urls;
}
