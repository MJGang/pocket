import { createJiti } from "../../../node_modules/.pnpm/jiti@2.4.2/node_modules/jiti/lib/jiti.mjs";

const jiti = createJiti(import.meta.url, {
  "interopDefault": true,
  "alias": {
    "create-pocket": "/home/gangmj/workspaces/pocket/packages/create-pocket"
  },
  "transformOptions": {
    "babel": {
      "plugins": []
    }
  }
})

/** @type {import("/home/gangmj/workspaces/pocket/packages/create-pocket/src/index.js")} */
const _module = await jiti.import("/home/gangmj/workspaces/pocket/packages/create-pocket/src/index.js");

export default _module?.default ?? _module;