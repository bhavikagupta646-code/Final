// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 3439911202465907689391503439381438391780908844635863138358757408440528475632;
    uint256 constant alphay  = 18602624708564635630285022288779727575696374204848842892953527808085372109792;
    uint256 constant betax1  = 21460966253900794287949295134033243531660959713706865223393196214978607240290;
    uint256 constant betax2  = 7365538648989704468167645046755336304292493774657657740404099176628746740201;
    uint256 constant betay1  = 16883555874945266383361137883877243196286912759771541992129818401255530180080;
    uint256 constant betay2  = 14791992560415000945047242550125199769271752146497761521536038402153250453238;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 2209998021465118343572985431152808497098069088582482079772770108961639927590;
    uint256 constant deltax2 = 20369316722759211646138951028233893187704575462535402934501724323631705372379;
    uint256 constant deltay1 = 14036737415156937532375251066922700336940262344798029438619808706660559490322;
    uint256 constant deltay2 = 9657823545269813417445437574974600253270929657126711369279223310483568226631;

    
    uint256 constant IC0x = 6092690436159678830267617370986967341686735463732736090205338892668149766117;
    uint256 constant IC0y = 4846845536094147718685075376110273835385584479962406861557835403846658972852;
    
    uint256 constant IC1x = 10349739654922197262250941419118061549462699733719184505385118325373970844663;
    uint256 constant IC1y = 6914404384096855079491153393098983619723645615007504225980588034097452334345;
    
    uint256 constant IC2x = 15078855871574116400796911318707497929765859009407135213604598769565758199472;
    uint256 constant IC2y = 14358004102074579627614725682487649049564326724582304421559239359077061296773;
    
    uint256 constant IC3x = 12930230395629178979508954092203514640148582970543358003546499945696650850364;
    uint256 constant IC3y = 8039658187776024305985621841131641355185900125515713851394777543999081137128;
    
    uint256 constant IC4x = 10368282043100105283226623735728062624870307038405257339677751410531124973742;
    uint256 constant IC4y = 2601092698661800897813289335012948313795110164658409737914034857722693010697;
    
    uint256 constant IC5x = 3348402881608210741860967692354020386250210743596135170907478101785457010442;
    uint256 constant IC5y = 8614757141537711614250689404713347307078775388942617541780196989234408147226;
    
    uint256 constant IC6x = 11582944544268059529145980461389264346836517893271949953977455763591798870765;
    uint256 constant IC6y = 9546439576211064336506506296124721095930687176829769337543245275645686239338;
    
    uint256 constant IC7x = 6007989622663856663356136396751011452470905936274509575082028888457289896571;
    uint256 constant IC7y = 16475750618564153587028504099474613995936134241180366080580184018588766467505;
    
    uint256 constant IC8x = 2428218634768825893900656133783135161654194014570608016600161448814350478309;
    uint256 constant IC8y = 12889122202296348364252454826544837002135888452649075977610692922758829261780;
    
    uint256 constant IC9x = 21310490470685788946594171919751181191865252937291568464197968816638543827697;
    uint256 constant IC9y = 1087756509197104451103149694808902530302139323376521486998188509916315670482;
    
    uint256 constant IC10x = 20542679748234118280004688057320722865539849275215214393869933372373433878938;
    uint256 constant IC10y = 2479685022839187963209315896838452110270960623874341938745469181039849228619;
    
    uint256 constant IC11x = 8722194819477712011828943027225599587495978897588437465721847665596285465528;
    uint256 constant IC11y = 19880518148369435070493210451726444622269316165694992556030402075563364927447;
    
    uint256 constant IC12x = 4885901906536045103391567333640518667537841416727940434252762391179597093674;
    uint256 constant IC12y = 1595875987705335418746107055907302362033396178637547626893055114038007412609;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[12] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
