export * from "./external-rest-api-icon";
export * from "./graphql-api-icon";
export * from "./grpc-service-icon";
export * from "./payment-gateway-icon";
export * from "./email-provider-icon";
export * from "./sms-provider-icon";
export * from "./whatsapp-provider-icon";
export * from "./maps-provider-icon";
export * from "./oauth-integration-icon";
export * from "./third-party-webhook-icon";

import type { InfrastructureIconComponent } from "../types";
import { ExternalRestApiIcon } from "./external-rest-api-icon";
import { GraphqlApiIcon } from "./graphql-api-icon";
import { GrpcServiceIcon } from "./grpc-service-icon";
import { PaymentGatewayIcon } from "./payment-gateway-icon";
import { EmailProviderIcon } from "./email-provider-icon";
import { SmsProviderIcon } from "./sms-provider-icon";
import { WhatsappProviderIcon } from "./whatsapp-provider-icon";
import { MapsProviderIcon } from "./maps-provider-icon";
import { OauthIntegrationIcon } from "./oauth-integration-icon";
import { ThirdPartyWebhookIcon } from "./third-party-webhook-icon";

export const externalIntegrationsIconRegistry: Record<string, InfrastructureIconComponent> = {
  "external-rest-api": ExternalRestApiIcon,
  "graphql-api": GraphqlApiIcon,
  "grpc-service": GrpcServiceIcon,
  "payment-gateway": PaymentGatewayIcon,
  "email-provider": EmailProviderIcon,
  "sms-provider": SmsProviderIcon,
  "whatsapp-provider": WhatsappProviderIcon,
  "maps-provider": MapsProviderIcon,
  "oauth-integration": OauthIntegrationIcon,
  "third-party-webhook": ThirdPartyWebhookIcon,
};

export function getExternalIntegrationsIcon(
  slug: string
): InfrastructureIconComponent | undefined {
  return externalIntegrationsIconRegistry[slug];
}

