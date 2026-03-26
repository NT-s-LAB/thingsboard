import { Injectable } from '@nestjs/common';
import { TbDevice } from '../interfaces/thingsboard-api.interface';
import { Device } from '@prisma/client';

@Injectable()
export class DeviceMapper {
  /**
   * Map ThingsBoard device to local device create data
   */
  tbDeviceToLocalCreate(tbDevice: TbDevice, areaId: string, deviceTypeId: string): Partial<Device> {
    return {
      name: tbDevice.name,
      description: tbDevice.additionalInfo?.description || null,
      tbDeviceId: tbDevice.id.id,
      tbEntityId: `${tbDevice.id.entityType}:${tbDevice.id.id}`,
      areaId,
      deviceTypeId,
      isActive: true,
      isOnline: false,
    };
  }

  /**
   * Map local device to ThingsBoard device format
   */
  localToTbDevice(device: Device & { deviceType?: { name: string } }): Partial<TbDevice> {
    return {
      name: device.name,
      type: device.deviceType?.name || 'default',
      label: device.description || undefined,
      additionalInfo: {
        description: device.description,
        areaId: device.areaId,
        serialNumber: device.serialNumber,
        model: device.model,
        firmware: device.firmware,
      },
    };
  }

  /**
   * Map ThingsBoard device to local update data
   */
  tbDeviceToLocalUpdate(tbDevice: TbDevice): Partial<Device> {
    return {
      name: tbDevice.name,
      description: tbDevice.additionalInfo?.description || undefined,
    };
  }

  /**
   * Map telemetry data from ThingsBoard format to a simplified format
   * Handles both WebSocket format [[ts, value]] and REST API format [{ts, value}]
   */
  mapTelemetryData(tbData: Record<string, any[]>): Record<string, any> {
    console.log('[DeviceMapper] Input tbData:', JSON.stringify(tbData, null, 2));
    
    const result: Record<string, any> = {};
    for (const [key, values] of Object.entries(tbData)) {
      console.log(`[DeviceMapper] Processing key "${key}":`, JSON.stringify(values));
      
      if (values && values.length > 0) {
        const latest = values[0];
        console.log(`[DeviceMapper] Latest value for "${key}":`, latest, 'isArray:', Array.isArray(latest));
        
        // Handle WebSocket format: [[timestamp, value]]
        if (Array.isArray(latest)) {
          const parsedValue = this.parseValue(String(latest[1]));
          result[key] = {
            value: parsedValue,
            timestamp: latest[0],
          };
          console.log(`[DeviceMapper] Parsed (WebSocket format) "${key}":`, result[key]);
        }
        // Handle REST API format: [{ ts, value }]
        else if (typeof latest === 'object' && 'value' in latest) {
          const parsedValue = this.parseValue(String(latest.value));
          result[key] = {
            value: parsedValue,
            timestamp: latest.ts,
          };
          console.log(`[DeviceMapper] Parsed (REST format) "${key}":`, result[key]);
        } else {
          console.log(`[DeviceMapper] Unknown format for "${key}":`, typeof latest, latest);
        }
      }
    }
    
    console.log('[DeviceMapper] Final result:', JSON.stringify(result, null, 2));
    return result;
  }

  private parseValue(value: string): any {
    // Try to parse as number
    const num = Number(value);
    if (!isNaN(num)) return num;

    // Try to parse as boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
