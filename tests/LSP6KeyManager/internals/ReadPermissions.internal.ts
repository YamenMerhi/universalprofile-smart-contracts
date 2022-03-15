import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

// constants
import {
  ALL_PERMISSIONS_SET,
  ERC725YKeys,
  PERMISSIONS,
} from "../../../constants";

// setup
import { LSP6InternalsTestContext } from "../../utils/context";
import { setupKeyManagerHelper } from "../../utils/fixtures";

// helpers
const abiCoder = ethers.utils.defaultAbiCoder;

export const testReadingPermissionsInternals = (
  buildContext: () => Promise<LSP6InternalsTestContext>
) => {
  let context: LSP6InternalsTestContext;

  describe("`getPermissionsFor(...)` -> reading permissions", () => {
    let addressCanSetData: SignerWithAddress,
      addressCanSetDataAndCall: SignerWithAddress;

    beforeEach(async () => {
      context = await buildContext();

      addressCanSetData = context.accounts[1];
      addressCanSetDataAndCall = context.accounts[2];

      const permissionKeys = [
        ERC725YKeys.LSP6["AddressPermissions:Permissions"] +
          context.owner.address.substring(2),
        ERC725YKeys.LSP6["AddressPermissions:Permissions"] +
          addressCanSetData.address.substring(2),
        ERC725YKeys.LSP6["AddressPermissions:Permissions"] +
          addressCanSetDataAndCall.address.substring(2),
      ];

      const permissionValues = [
        ALL_PERMISSIONS_SET,
        ethers.utils.hexZeroPad(PERMISSIONS.SETDATA, 32),
        ethers.utils.hexZeroPad(PERMISSIONS.SETDATA + PERMISSIONS.CALL, 32),
      ];

      await setupKeyManagerHelper(context, permissionKeys, permissionValues);
    });

    it("Should return ALL_PERMISSIONS for owner", async () => {
      expect(
        await context.keyManagerHelper.getPermissionsFor(context.owner.address)
      ).toEqual(ALL_PERMISSIONS_SET); // ALL_PERMISSIONS = "0xffff..."
    });

    it("Should return SETDATA", async () => {
      expect(
        await context.keyManagerHelper.getPermissionsFor(
          addressCanSetData.address
        )
      ).toEqual(ethers.utils.hexZeroPad(PERMISSIONS.SETDATA, 32));
    });

    it("Should return SETDATA + CALL", async () => {
      expect(
        await context.keyManagerHelper.getPermissionsFor(
          addressCanSetDataAndCall.address
        )
      ).toEqual(
        ethers.utils.hexZeroPad(PERMISSIONS.SETDATA + PERMISSIONS.CALL, 32)
      );
    });
  });

  describe("`getPermissionsFor(...)` -> reading empty permissions", () => {
    let moreThan32EmptyBytes: SignerWithAddress,
      lessThan32EmptyBytes: SignerWithAddress,
      oneEmptyByte: SignerWithAddress;

    const expectedEmptyPermission = abiCoder.encode(
      ["bytes32"],
      ["0x0000000000000000000000000000000000000000000000000000000000000000"]
    );

    beforeEach(async () => {
      context = await buildContext();

      moreThan32EmptyBytes = context.accounts[0];
      lessThan32EmptyBytes = context.accounts[1];
      oneEmptyByte = context.accounts[2];

      const permissionKeys = [
        ERC725YKeys.LSP6["AddressPermissions:Permissions"] +
          context.owner.address.substring(2),
        ERC725YKeys.LSP6["AddressPermissions:Permissions"] +
          moreThan32EmptyBytes.address.substring(2),
        ERC725YKeys.LSP6["AddressPermissions:Permissions"] +
          lessThan32EmptyBytes.address.substring(2),
        ERC725YKeys.LSP6["AddressPermissions:Permissions"] +
          oneEmptyByte.address.substring(2),
      ];

      const permissionValues = [
        ALL_PERMISSIONS_SET,
        "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "0x000000000000000000000000000000",
        "0x00",
      ];

      await setupKeyManagerHelper(context, permissionKeys, permissionValues);
    });

    it("should cast permissions to 32 bytes when reading permissions stored as more than 32 empty bytes", async () => {
      const result = await context.keyManagerHelper.getPermissionsFor(
        moreThan32EmptyBytes.address
      );
      expect(result).toEqual(expectedEmptyPermission);
    });

    it("should cast permissions to 32 bytes when reading permissions stored as less than 32 empty bytes", async () => {
      const result = await context.keyManagerHelper.getPermissionsFor(
        lessThan32EmptyBytes.address
      );
      expect(result).toEqual(expectedEmptyPermission);
    });

    it("should cast permissions to 32 bytes when reading permissions stored as one empty byte", async () => {
      const result = await context.keyManagerHelper.getPermissionsFor(
        oneEmptyByte.address
      );
      expect(result).toEqual(expectedEmptyPermission);
    });
  });

  describe("AddressPermissions[]", () => {
    let firstBeneficiary: SignerWithAddress,
      secondBeneficiary: SignerWithAddress,
      thirdBeneficiary: SignerWithAddress,
      fourthBeneficiary: SignerWithAddress;

    let permissionArrayKeys: string[] = [];
    let permissionArrayValues: string[] = [];

    beforeEach(async () => {
      context = await buildContext();

      firstBeneficiary = context.accounts[1];
      secondBeneficiary = context.accounts[2];
      thirdBeneficiary = context.accounts[3];
      fourthBeneficiary = context.accounts[4];

      let permissionKeys = [
        ERC725YKeys.LSP6["AddressPermissions:Permissions"] +
          context.owner.address.substring(2),
        ERC725YKeys.LSP6["AddressPermissions:Permissions"] +
          firstBeneficiary.address.substring(2),
        ERC725YKeys.LSP6["AddressPermissions:Permissions"] +
          secondBeneficiary.address.substring(2),
        ERC725YKeys.LSP6["AddressPermissions:Permissions"] +
          thirdBeneficiary.address.substring(2),
        ERC725YKeys.LSP6["AddressPermissions:Permissions"] +
          fourthBeneficiary.address.substring(2),
      ];

      let permissionValues = [
        ALL_PERMISSIONS_SET,
        ethers.utils.hexZeroPad(PERMISSIONS.SETDATA, 32),
        ethers.utils.hexZeroPad(PERMISSIONS.CALL, 32),
        ethers.utils.hexZeroPad(PERMISSIONS.TRANSFERVALUE, 32),
        ethers.utils.hexZeroPad(PERMISSIONS.SIGN, 32),
      ];

      // set AddressPermissions array keys
      permissionArrayKeys = [
        ERC725YKeys.LSP6["AddressPermissions[]"],
        ERC725YKeys.LSP6["AddressPermissions[]"].slice(0, 34) +
          "00000000000000000000000000000000",
        ERC725YKeys.LSP6["AddressPermissions[]"].slice(0, 34) +
          "00000000000000000000000000000001",
        ERC725YKeys.LSP6["AddressPermissions[]"].slice(0, 34) +
          "00000000000000000000000000000002",
        ERC725YKeys.LSP6["AddressPermissions[]"].slice(0, 34) +
          "00000000000000000000000000000003",
        ERC725YKeys.LSP6["AddressPermissions[]"].slice(0, 34) +
          "00000000000000000000000000000004",
      ];

      // set AddressPermissions array values
      permissionArrayValues = [
        "0x05",
        context.owner.address,
        firstBeneficiary.address,
        secondBeneficiary.address,
        thirdBeneficiary.address,
        fourthBeneficiary.address,
      ];

      permissionKeys = permissionKeys.concat(permissionArrayKeys);
      permissionValues = permissionValues.concat(permissionArrayValues);

      await setupKeyManagerHelper(context, permissionKeys, permissionValues);
    });

    it("Value should be 5 for key 'AddressPermissions[]'", async () => {
      let [result] = await context.universalProfile.getData([
        ERC725YKeys.LSP6["AddressPermissions[]"],
      ]);
      expect(result).toEqual("0x05");
    });

    // check array indexes individually
    for (let ii = 1; ii <= 5; ii++) {
      it(`Checking address (=value) stored at AddressPermissions[${ii}]'`, async () => {
        let [result] = await context.universalProfile.getData([
          permissionArrayKeys[ii],
        ]);
        // raw bytes are stored lower case, so we need to checksum the address retrieved
        result = ethers.utils.getAddress(result);
        expect(result).toEqual(permissionArrayValues[ii]);
      });
    }
  });
};
