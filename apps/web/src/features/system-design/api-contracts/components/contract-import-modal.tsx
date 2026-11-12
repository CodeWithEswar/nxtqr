"use client";

/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Contract Import Modal
 */

import React, { useState } from "react";
import type {
  ContractProtocol,
  SpecificationFormat,
  InterfaceExposure,
} from "@nxtqr/architecture-intelligence";
import { CloseIcon, PlusIcon } from "@nxtqr/icons";

interface ContractImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (params: {
    name: string;
    description?: string;
    protocol: ContractProtocol;
    format: SpecificationFormat;
    specText: string;
    providerServiceId: string;
    exposure: InterfaceExposure;
  }) => void;
}

const PRESET_OPENAPI = JSON.stringify(
  {
    openapi: "3.0.0",
    info: { title: "Payment Processing API", version: "1.0.0" },
    paths: {
      "/charges": {
        post: {
          summary: "Create Payment Charge",
          operationId: "createCharge",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amountCents", "currency", "token"],
                  properties: {
                    amountCents: { type: "integer" },
                    currency: { type: "string" },
                    token: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Charge Authorized",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["chargeId", "status"],
                    properties: {
                      chargeId: { type: "string" },
                      status: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  null,
  2
);

const PRESET_GRAPHQL = `
type Query {
  getUser(id: ID!): User
}

type User {
  id: ID!
  email: String!
  displayName: String
}
`;

const PRESET_PROTOBUF = `
syntax = "proto3";

package nxtqr.auth.v1;

service AuthService {
  rpc ValidateSession (SessionToken) returns (UserSession);
}

message SessionToken {
  string token = 1;
}

message UserSession {
  string user_id = 1;
  bool is_active = 2;
  int64 expires_at = 3;
}
`;

export function ContractImportModal({ isOpen, onClose, onImport }: ContractImportModalProps) {
  const [name, setName] = useState("Payment Processing API");
  const [description] = useState("External and internal payment gateway contract");
  const [providerServiceId, setProviderServiceId] = useState("payment-service");
  const [protocol, setProtocol] = useState<ContractProtocol>("rest");
  const [format, setFormat] = useState<SpecificationFormat>("openapi_3x");
  const [exposure, setExposure] = useState<InterfaceExposure>("internal");
  const [specText, setSpecText] = useState(PRESET_OPENAPI);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProtocolSelect = (newProtocol: ContractProtocol) => {
    setProtocol(newProtocol);
    if (newProtocol === "rest") {
      setFormat("openapi_3x");
      setSpecText(PRESET_OPENAPI);
    } else if (newProtocol === "graphql") {
      setFormat("graphql_sdl");
      setSpecText(PRESET_GRAPHQL);
    } else if (newProtocol === "grpc") {
      setFormat("protobuf");
      setSpecText(PRESET_PROTOBUF);
    } else if (newProtocol === "async_event") {
      setFormat("asyncapi_2x");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      onImport({
        name,
        description,
        protocol,
        format,
        specText,
        providerServiceId,
        exposure,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to parse specification");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-none p-4 select-none">
      <div className="w-full max-w-2xl bg-[#080808] border border-[#262626] rounded-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4 text-[#FFFFFF]" />
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Import API Specification</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#858585] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-md bg-[#1F1414] border border-[#404040] text-xs text-[#FFFFFF]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#B5B5B5] mb-1">
                Contract Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#0D0D0D] text-[#FFFFFF] border border-[#262626] rounded-md focus:border-[#404040] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#B5B5B5] mb-1">
                Provider Service ID
              </label>
              <input
                type="text"
                required
                value={providerServiceId}
                onChange={(e) => setProviderServiceId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#0D0D0D] text-[#FFFFFF] border border-[#262626] rounded-md focus:border-[#404040] focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#B5B5B5] mb-1">
                Protocol
              </label>
              <select
                value={protocol}
                onChange={(e) => handleProtocolSelect(e.target.value as ContractProtocol)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#0D0D0D] text-[#FFFFFF] border border-[#262626] rounded-md focus:border-[#404040] focus:outline-none"
              >
                <option value="rest">REST</option>
                <option value="graphql">GraphQL</option>
                <option value="grpc">gRPC</option>
                <option value="async_event">Async Event</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#B5B5B5] mb-1">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as SpecificationFormat)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#0D0D0D] text-[#FFFFFF] border border-[#262626] rounded-md focus:border-[#404040] focus:outline-none"
              >
                <option value="openapi_3x">OpenAPI 3.x</option>
                <option value="graphql_sdl">GraphQL SDL</option>
                <option value="protobuf">Protobuf 3</option>
                <option value="asyncapi_2x">AsyncAPI 2.x</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#B5B5B5] mb-1">
                Exposure
              </label>
              <select
                value={exposure}
                onChange={(e) => setExposure(e.target.value as InterfaceExposure)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#0D0D0D] text-[#FFFFFF] border border-[#262626] rounded-md focus:border-[#404040] focus:outline-none"
              >
                <option value="internal">Internal (Private)</option>
                <option value="partner">Partner</option>
                <option value="public">Public (External)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-[#B5B5B5]">
                Specification Document
              </label>
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    handleProtocolSelect("rest");
                    setSpecText(PRESET_OPENAPI);
                  }}
                  className="text-[#858585] hover:text-[#FFFFFF] underline"
                >
                  Preset: OpenAPI
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    handleProtocolSelect("graphql");
                    setSpecText(PRESET_GRAPHQL);
                  }}
                  className="text-[#858585] hover:text-[#FFFFFF] underline"
                >
                  Preset: GraphQL
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    handleProtocolSelect("grpc");
                    setSpecText(PRESET_PROTOBUF);
                  }}
                  className="text-[#858585] hover:text-[#FFFFFF] underline"
                >
                  Preset: Protobuf
                </button>
              </div>
            </div>
            <textarea
              required
              rows={12}
              value={specText}
              onChange={(e) => setSpecText(e.target.value)}
              className="w-full p-2.5 font-mono text-[11px] bg-[#0D0D0D] text-[#FFFFFF] border border-[#262626] rounded-md focus:border-[#404040] focus:outline-none leading-relaxed"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-[#262626] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-[#858585] hover:text-[#FFFFFF] bg-transparent hover:bg-[#141414] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-[#FFFFFF] bg-[#1A1A1A] hover:bg-[#262626] active:bg-[#0D0D0D] border border-[#333333] hover:border-[#404040] rounded-md transition-colors"
            >
              Parse & Register Contract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

