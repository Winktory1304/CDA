function onloadFunc() {
    console.log("onloadFunc called");
    getData("");
    // postData("test", { name: "Carsten", age: 42 })
    // deleteData("test", { name: "Carsten", age: 42 })
}

const BASE_URL = "https://carstens-dart-app-default-rtdb.europe-west1.firebasedatabase.app/";

async function getData(path = "") {
    let response = await fetch(BASE_URL + path + ".json");
    let responseToJson = await response.json();
    console.log(responseToJson);
    console.log(response);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

async function putData(path = "", data = {}) {
    let response = await fetch(BASE_URL + path + ".json", {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}


// async function postData(path = "", data = {}) {
//     let response = await fetch(BASE_URL + path + ".json", {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(data)
//     });
//     return responseToJson = await response.json();
// }

async function deleteData(path = "", data = {}) {
    let response = await fetch(BASE_URL + path + ".json", {
        method: 'DELETE',
        body: JSON.stringify(data)
    });
    return responseToJson = await response.json();
}

