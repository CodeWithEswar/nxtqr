export * from "./object-storage-icon";
export * from "./block-storage-icon";
export * from "./file-storage-icon";
export * from "./distributed-file-system-icon";
export * from "./blob-storage-icon";
export * from "./media-storage-icon";
export * from "./backup-storage-icon";
export * from "./archive-storage-icon";
export * from "./storage-gateway-icon";
export * from "./content-repository-icon";

import type { InfrastructureIconComponent } from "../types";
import { ObjectStorageIcon } from "./object-storage-icon";
import { BlockStorageIcon } from "./block-storage-icon";
import { FileStorageIcon } from "./file-storage-icon";
import { DistributedFileSystemIcon } from "./distributed-file-system-icon";
import { BlobStorageIcon } from "./blob-storage-icon";
import { MediaStorageIcon } from "./media-storage-icon";
import { BackupStorageIcon } from "./backup-storage-icon";
import { ArchiveStorageIcon } from "./archive-storage-icon";
import { StorageGatewayIcon } from "./storage-gateway-icon";
import { ContentRepositoryIcon } from "./content-repository-icon";

export {
  ObjectStorageIcon,
  BlockStorageIcon,
  FileStorageIcon,
  DistributedFileSystemIcon,
  BlobStorageIcon,
  MediaStorageIcon,
  BackupStorageIcon,
  ArchiveStorageIcon,
  StorageGatewayIcon,
  ContentRepositoryIcon,
};

export const storageAndFileSystemsIconRegistry: Record<string, InfrastructureIconComponent> = {
  "object-storage": ObjectStorageIcon,
  "block-storage": BlockStorageIcon,
  "file-storage": FileStorageIcon,
  "distributed-file-system": DistributedFileSystemIcon,
  "blob-storage": BlobStorageIcon,
  "media-storage": MediaStorageIcon,
  "backup-storage": BackupStorageIcon,
  "archive-storage": ArchiveStorageIcon,
  "storage-gateway": StorageGatewayIcon,
  "content-repository": ContentRepositoryIcon,
};

export function getStorageAndFileSystemsInfrastructureIcon(slug: string): InfrastructureIconComponent | undefined {
  return storageAndFileSystemsIconRegistry[slug];
}
