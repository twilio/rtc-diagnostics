/**
 * The WebRTC API's [RTCIceCandidateStats](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidateStats)
 * dictionary which provides information related to an ICE candidate.
 */
export interface RTCIceCandidateStats {
  [key: string]: any;
}

/**
 * Represents the WebRTC stats for the ICE candidate pair used to connect to media, if candidates were selected.
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
export async function getRTCIceCandidateStatsReport(peerConnection: RTCPeerConnection): Promise<RTCIceCandidateStatsReport> {
  const report = await peerConnection.getStats() as Map<string, RTCStats>;
  const statsArrays = Array.from(report.values()).reduce((result, stat) => {
    switch (stat.type) {
      case 'candidate-pair':
        result.candidatePairs.push(stat);
        break;
      case 'local-candidate':
        result.localCandidates.push(stat);
        break;
      case 'remote-candidate':
        result.remoteCandidates.push(stat);
        break;
      case 'transport':
        // This transport is the one being used if selectedCandidatePairId is populated
        if (stat.selectedCandidatePairId) {
          result.transport = stat;
        }
        break;
    }
    return result;
  }, { candidatePairs: [], localCandidates: [], remoteCandidates: [] } as Record<string, RTCStats[] | RTCStats>);

  const candidatePairs = statsArrays.candidatePairs as RTCStats[];
  const localCandidates = statsArrays.localCandidates as RTCStats[];
  const remoteCandidates = statsArrays.remoteCandidates as RTCStats[];
  const transport = statsArrays.transport as RTCStats;

  // This is a report containing information about the selected candidates, such as IDs
  // This is coming from WebRTC stats directly and doesn't contain the actual ICE Candidates info
  const selectedCandidatePairReport = candidatePairs.find(pair =>
    // Firefox
    pair.selected ||
    // Spec-compliant way
    (transport && pair.id === transport.selectedCandidatePairId),
  );

  let selectedIceCandidatePairStats;
  if (selectedCandidatePairReport) {
    selectedIceCandidatePairStats = {
      localCandidate: localCandidates.find(candidate => candidate.id === selectedCandidatePairReport.localCandidateId),
      remoteCandidate: remoteCandidates.find(candidate => candidate.id === selectedCandidatePairReport.remoteCandidateId),
    };
  }

  return {
    iceCandidateStats: [...localCandidates, ...remoteCandidates],
    selectedIceCandidatePairStats,
  } as RTCIceCandidateStatsReport;
}
