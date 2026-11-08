import { siteConfig } from '@/config/site';

export interface AdminSettings {
  announcementText: string;
  announcementEnabled: boolean;
  whatsappNumber: string;
  contactPhone: string;
  supportEmail: string;
  studioAddress: string;
  flatShippingRate: number;
  freeShippingThreshold: number;
  codNotice: string;
}

export const DEFAULT_SETTINGS: AdminSettings = {
  announcementText: siteConfig.announcement.text,
  announcementEnabled: siteConfig.announcement.enabled,
  whatsappNumber: siteConfig.contact.whatsapp,
  contactPhone: siteConfig.contact.phone,
  supportEmail: siteConfig.contact.email,
  studioAddress: siteConfig.contact.address,
  flatShippingRate: siteConfig.shipping.flatRate,
  freeShippingThreshold: siteConfig.shipping.freeShippingThreshold,
  codNotice: 'Cash on Delivery (COD) Only - Pay when you receive parcel',
};
