const configs = require("./config");

async function fronteggToken(env) {
  try {
    const credentials = configs.fronteggCredentials[env];
    if (!credentials) {
      throw new Error(`No credentials found for environment: ${env}`);
    }
    const response = await fetch("https://api.frontegg.com/auth/vendor", {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.token) {
      throw new Error("Invalid response format. Token is missing.");
    }
    return data.token;
  } catch (error) {
    console.error("Error fetching Frontegg token:", error.message);
    throw error;
  }
}

async function getAllcategories(env) {
  try {
    const token = await fronteggToken(env);
    if (!token) {
      throw new Error("Failed to retrieve the authentication token.");
    }
    const response = await fetch(
      "https://api.frontegg.com/identity/resources/permissions/v1/categories",
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Unexpected data format received.");
    }

    const filteredData = data
      .filter((i) => !i.feCategory)
      .map((i) => ({
        name: i.name,
        id: i.id,
      }));

    return filteredData;
  } catch (error) {
    console.error("Error in getAllcategories:", error.message);
  }
}

async function getAllPermissions(env) {
  try {
    const response = await fetch(
      "https://api.frontegg.com/identity/resources/permissions/v1",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          authorization: `Bearer ${await fronteggToken(env)}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch permissions: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getAllPermissions:", error.message);
    throw error;
  }
}

async function getCategoryMappings(fromEnvcat, toEnvCat, permissions) {
  try {
    const catA = await getAllcategories(fromEnvcat);
    const catB = await getAllcategories(toEnvCat);

    const replacementMap = catB.reduce((acc, { name, id }) => {
      acc[name] = id;
      return acc;
    }, {});

    const categoryNameMap = catA.reduce((acc, { name, id }) => {
      acc[id] = name;
      return acc;
    }, {});

    const filteredData = permissions
      .filter(
        (item) =>
          !item.fePermission &&
          item.name !== "Read Only" &&
          item.name !== "Admin"
      )
      .map((item) => {
        const categoryName = categoryNameMap[item.categoryId];
        const newCategoryId = replacementMap[categoryName];

        return {
          key: item.key,
          name: item.name,
          description: item.description,
          categoryId: newCategoryId || "",
          assignmentType: item.assignmentType,
        };
      });

    return filteredData;
  } catch (error) {
    console.error("Error in getCategoryMappings:", error.message);
    throw error;
  }
}

async function createPermissions(from, to) {
  try {
    const fromPermissions = await getAllPermissions(from);
    const toPermissions = await getAllPermissions(to);

    const toPermissionsMap = toPermissions.reduce((acc, { key }) => {
      acc[key] = true;
      return acc;
    }, {});

    //Filtering out the permissions that already exist in the 'to' environment.
    const newPermissions = fromPermissions.filter(
      (perm) => !toPermissionsMap[perm.key]
    );

    const filteredPermissions = await getCategoryMappings(
      from,
      to,
      newPermissions
    );

    if (
      !Array.isArray(filteredPermissions) ||
      filteredPermissions.length === 0
    ) {
      console.log(`No new permissions to migrate from ${from} to ${to}`);
      return;
    }
    const response = await fetch(
      "https://api.frontegg.com/identity/resources/permissions/v1",
      {
        method: "POST",
        body: JSON.stringify(filteredPermissions),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          authorization: `Bearer ${await fronteggToken(to)}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failed to create permissions: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    console.log(
      `Permissions successfully migrated from ${from} to ${to}`,
      data
    );
  } catch (error) {
    console.error("Error in createPermissions:", error.message);
  }
}

createPermissions("dev", "qa");

// async function getAllRoles(env) {
//   const token = await fronteggToken(configs.fronteggCredentials[`${env}`]);
//   try {
//     const response = await fetch(
//       "https://api.frontegg.com/identity/resources/roles/v1",
//       {
//         method: "GET",
//         headers: {
//           Accept: "application/json",
//           authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     const data = await response.json();
//     const filteredData = data.filter(
//       (item) =>
//         !item.fePermission && item.name !== "Read Only" && item.name !== "Admin"
//     );

//     console.log(filteredData);

//     return;
//   } catch (error) {
//     console.log(error);
//   }
// }
