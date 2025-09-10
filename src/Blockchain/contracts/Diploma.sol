// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title DiplomaRegistry
 * @dev Contrat minimaliste : aucune donnée stockée on‑chain en dehors des events.
 *      Chaque appel à issueDiplomas() émet un event DiplomaIssued pour chaque hash fourni.
 */
contract DiplomaRegistry {
    /**
     * @dev Event émis pour chaque diplôme d'un batch.
     * @param batchId Identifiant fonctionnel du lot (ex: "2024-INF-01").
     * @param diplome Libellé / type de diplôme (ex: "Ingénieur Informatique").
     * @param diplomaHash Empreinte (bytes32) du diplôme (ex: keccak256 du JSON).
     * @param timestamp Bloc timestamp au moment de l'émission.
     */
    event DiplomaIssued(string batchId, string diplome, bytes32 diplomaHash, uint256 timestamp);

    /**
     * @notice Émet un event par hash de diplôme fourni.
     * @param batchId Identifiant du batch.
     * @param diplome Libellé du diplôme.
     * @param diplomaHashes Tableau d'empreintes bytes32.
     */
    function issueDiplomas(
        string calldata batchId,
        string calldata diplome,
        bytes32[] calldata diplomaHashes
    ) external {
        uint256 ts = block.timestamp;
        for (uint256 i = 0; i < diplomaHashes.length; i++) {
            emit DiplomaIssued(batchId, diplome, diplomaHashes[i], ts);
        }
    }
}
