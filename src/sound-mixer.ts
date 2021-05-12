import {
	Device,
	AudioSession,
	DeviceType,
	VolumeScalar,
	AudioSessionState
} from "./model/model";

import { round } from "lodash";

const ROUND_PRECISION = 3;

const sMixerModule = require(`${__dirname}/SoundMixer.node`)


const _safeWrap = (func: Function) => {
	try {
		return func();
	} catch (err) {
		if (err.name === "TypeError")
			throw new TypeError(err)
		throw new Error(err);
	}
}


class AudioSessionImpl extends AudioSession {

	get mute() {
		return _safeWrap(() => sMixerModule.GetAudioSessionMute(this.deviceId, this.id))
	}

	get volume() {
		return round(_safeWrap(() => sMixerModule.GetAudioSessionVolume(this.deviceId, this.id)), ROUND_PRECISION);
	}

	set mute(mute: boolean) {
		_safeWrap(() => sMixerModule.SetAudioSessionMute(this.deviceId, this.id, mute));
	}

	set volume(volume: VolumeScalar) {
		_safeWrap(() => sMixerModule.SetAudioSessionVolume(this.deviceId, this.id, volume));
	}

}

class DeviceImpl extends Device {

	get sessions() {
		return sMixerModule.GetSessions(this.id).map(({ id, path, state }: AudioSession) => new AudioSessionImpl(this.id, id, path, state));
	}

	get mute() {
		return _safeWrap(() => sMixerModule.GetEndpointMute(this.id));
	}

	get volume() {
		return round(_safeWrap(() => sMixerModule.GetEndpointVolume(this.id)), ROUND_PRECISION);
	}

	set mute(mute: boolean) {
		_safeWrap(() => sMixerModule.SetEndpointMute(this.id, mute));
	}

	set volume(volume: VolumeScalar) {
		_safeWrap(() => sMixerModule.SetEndpointVolume(this.id, volume));
	}

	getSessionById(id: string) {
		const sessions: AudioSession[] = sMixerModule.GetAudioSessions(this.id).filter(({ id: sessionId }: AudioSession) => id === sessionId);
		if (sessions.length > 0) {
			return sessions[0]
		}
		return undefined;
	}

}

export default class SoundMixer {

	static get devices(): Device[] {
		return sMixerModule.GetDevices().map(({ id, name, type }: { id: string, name: string, type: number }) => new DeviceImpl(id, name, type))
	}

	static getDefaultDevice(type: DeviceType): Device {
		const { id, name, type: nativeType } = sMixerModule.GetDefaultDevice(type);
		return new DeviceImpl(id, name, nativeType);
	}

	static getDeviceById(id: string): Device | undefined {
		const devices: Device[] = sMixerModule.GetDevices().filter(({ id: devId }: Device) => devId === id);
		if (devices.length > 0)
			return devices[0];
		return undefined;
	}

}

export {
	Device,
	AudioSession,
	DeviceType,
	AudioSessionState,
	VolumeScalar
}