// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title HealthShieldRegistry
 * @notice Central registry for verified medical institutions, insurers, and patients.
 */
contract HealthShieldRegistry is AccessControl {
    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    struct Hospital {
        string hospitalId;
        string name;
        uint256 babyJubjubAx;
        uint256 babyJubjubAy;
        bool isRegistered;
        bool isActive;
        uint256 registeredAt;
    }

    struct Insurer {
        string insurerId;
        string name;
        bool isRegistered;
        bool isActive;
        uint256 registeredAt;
    }

    // Mappings
    mapping(address => Hospital) public hospitals;
    mapping(string => address) public hospitalIdToAddress;
    mapping(address => Insurer) public insurers;
    mapping(string => address) public insurerIdToAddress;

    // Events
    event HospitalRegistered(address indexed wallet, string hospitalId, string name, uint256 ax, uint256 ay);
    event HospitalStatusUpdated(address indexed wallet, bool isActive);
    event InsurerRegistered(address indexed wallet, string insurerId, string name);
    event InsurerStatusUpdated(address indexed wallet, bool isActive);

    error HospitalAlreadyRegistered(address wallet);
    error InsurerAlreadyRegistered(address wallet);
    error EntityNotFound(address wallet);

    constructor(address _admin) {
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(REGISTRAR_ROLE, _admin);
    }

    /**
     * @notice Register a new hospital with its authoritative BabyJubjub signing key
     */
    function registerHospital(
        address _wallet,
        string calldata _hospitalId,
        string calldata _name,
        uint256 _ax,
        uint256 _ay
    ) external onlyRole(REGISTRAR_ROLE) {
        if (hospitals[_wallet].isRegistered) revert HospitalAlreadyRegistered(_wallet);

        hospitals[_wallet] = Hospital({
            hospitalId: _hospitalId,
            name: _name,
            babyJubjubAx: _ax,
            babyJubjubAy: _ay,
            isRegistered: true,
            isActive: true,
            registeredAt: block.timestamp
        });
        hospitalIdToAddress[_hospitalId] = _wallet;

        emit HospitalRegistered(_wallet, _hospitalId, _name, _ax, _ay);
    }

    /**
     * @notice Set active status of a hospital
     */
    function setHospitalStatus(address _wallet, bool _isActive) external onlyRole(ADMIN_ROLE) {
        if (!hospitals[_wallet].isRegistered) revert EntityNotFound(_wallet);
        hospitals[_wallet].isActive = _isActive;
        emit HospitalStatusUpdated(_wallet, _isActive);
    }

    /**
     * @notice Register a certified insurance provider
     */
    function registerInsurer(
        address _wallet,
        string calldata _insurerId,
        string calldata _name
    ) external onlyRole(REGISTRAR_ROLE) {
        if (insurers[_wallet].isRegistered) revert InsurerAlreadyRegistered(_wallet);

        insurers[_wallet] = Insurer({
            insurerId: _insurerId,
            name: _name,
            isRegistered: true,
            isActive: true,
            registeredAt: block.timestamp
        });
        insurerIdToAddress[_insurerId] = _wallet;

        emit InsurerRegistered(_wallet, _insurerId, _name);
    }

    /**
     * @notice Set active status of an insurer
     */
    function setInsurerStatus(address _wallet, bool _isActive) external onlyRole(ADMIN_ROLE) {
        if (!insurers[_wallet].isRegistered) revert EntityNotFound(_wallet);
        insurers[_wallet].isActive = _isActive;
        emit InsurerStatusUpdated(_wallet, _isActive);
    }

    /**
     * @notice Verify whether a given hospital wallet and BabyJubjub public key pair is certified
     */
    function isHospitalCertified(
        address _wallet,
        uint256 _ax,
        uint256 _ay
    ) external view returns (bool) {
        Hospital memory h = hospitals[_wallet];
        return h.isRegistered && h.isActive && (h.babyJubjubAx == _ax) && (h.babyJubjubAy == _ay);
    }

    /**
     * @notice Verify whether an insurance provider is authorized
     */
    function isInsurerAuthorized(address _wallet) external view returns (bool) {
        Insurer memory ins = insurers[_wallet];
        return ins.isRegistered && ins.isActive;
    }
}
