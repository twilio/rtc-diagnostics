/**
 * The WebRTC API's [RTCIceCandidateStats](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidateStats)
 * dictionary which provides information related to an ICE candidate.
 * @internalapi
 */
export interface RTCIceCandidateStats {
    [key: string]: any;
}
/**
 * Represents the WebRTC stats for the ICE candidate pair used to connect to media, if candidates were selected.
 * @internalapi
 */
export interface RTCSelectedIceCandidatePairStats {
    /**
     * An [RTCIceCandidateStats](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidateStats)
     * object which provides information related to the selected local ICE candidate.
     */
    localCandidate: RTCIceCandidateStats;
    /**
     * An [RTCIceCandidateStats](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidateStats)
     * object which provides information related to the selected remote ICE candidate.
     */
    remoteCandidate: RTCIceCandidateStats;
}
/**
 * A WebRTC stats report containing relevant information about selected and gathered ICE candidates.
 * @internalapi
 */
export interface RTCIceCandidateStatsReport {
    /**
     * An array of WebRTC stats for the ICE candidates gathered when connecting to media.
     */
    iceCandidateStats: RTCIceCandidateStats[];
    /**
     * A WebRTC stats for the ICE candidate pair used to connect to media, if candidates were selected.
     */
    selectedIceCandidatePairStats?: RTCSelectedIceCandidatePairStats;
}
/**
 * The RTCStats dictionary is the basic statistics object used by WebRTC's statistics monitoring model,
 * providing the properties required of all statistics data objects.
 * See [RTCStats](https://developer.mozilla.org/en-US/docs/Web/API/RTCStats)
 * @internalapi
 */
export interface RTCStats {
    [key: string]: any;
    /**
     * Uniquely identifies the stats object
     */
    id: string;
    /**
     * Indicates the type of statistics the object contains,
     * taken from the enum type [RTCStatsType](https://developer.mozilla.org/en-US/docs/Web/API/RTCStatsType).
     */
    type: string;
}
/**
 * @internalapi
 * Generate a WebRTC stats report containing relevant information about ICE candidates for
 * the given [PeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
 * @param peerConnection
 */
export declare function getRTCIceCandidateStatsReport(peerConnection: RTCPeerConnection): Promise<RTCIceCandidateStatsReport>;
