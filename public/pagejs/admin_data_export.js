// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

function clean(dataToClean) {
    if (!dataToClean) {
        return '';
    }
    else {
        return dataToClean.replace('|', '');
    }
}

async function exportAllData() {
    // create an array of values to export
    var exportButton = document.querySelector('#export_data');
    var progressText = document.querySelector('#progress_text')
    exportButton.classList.add('disabled');
    var categoryArray = [];
    var line = '';
    // get all the categories
    await firebase.firestore().collection(firebaseData.collectionCategories).get()
        .then(function(querySnapshot) {
            // this worked
            categoriesToProcess = querySnapshot.size;
            var categoriesProcessed = 0;
            querySnapshot.forEach(function (catDoc) {
                // for each category| get all the items
                var categoryData = catDoc.data();
                // create the line for this
                line = catDoc.id
                    + '|' + clean(categoryData['name']) // category name
                    + '|' // item name
                    + '|' // item quality
                    + '|' // quantity
                    + '|' // GBP
                    + '|' // USD
                    + '|' // AUD
                    + '|' + clean(categoryData['description']) // cat/item description
                    + '|' + clean(categoryData['notes']) // cat/item notes
                    + '|' // item colour
                    + '|' // item physical
                    + '|' // item supplier
                    + '|' // item URL
                    + '|' // GBP notes
                    + '|' // USD notes
                    + '|' // AUD notes
                    ;
                // create this category
                categoryArray.push(line);
                progressText.innerHTML = "Getting data for category " + categoryData['name'];
            });
        })
        .catch(function(error) {
            // this didn't work
            console.log("Failed to get any matching documents: ", error);
        });
    // have all the categories, for each one get the items
    // now get all the items for this collection
    var categoryItems = [];
    for (var i = 0; i < categoryArray.length; ++i) {
        // for each category, get all the items
        var itemArray = [];
        var categoryDataLine = categoryArray[i];
        var categoryId = categoryDataLine.substr(0, categoryDataLine.indexOf('|'));
        var categoryRef = firebase.firestore().doc(firebaseData.collectionCategories + '/' + categoryId);
        await firebase.firestore().collection(firebaseData.collectionItems)
            .where("category_ref", "==", categoryRef).get()
            .then(function(querySnapshot) {
                // this worked, add all the lines for each item
                querySnapshot.forEach(function (itemDoc) {
                    var itemData = itemDoc.data();
                    // create the line for this
                    line = itemDoc.id
                        + '|' // category name
                        + '|' + clean(itemData['name']) // item name
                        + '|' + clean(itemData['quality']) // item quality
                        + '|' // quantity
                        + '|' // GBP
                        + '|' // USD
                        + '|' // AUD
                        + '|' + clean(itemData['description']) // cat/item description
                        + '|' + clean(itemData['notes'])       // cat/item notes
                        + '|' + clean(itemData['colours'])     // item colour
                        + '|' + clean(itemData['physical'])    // item physical
                        + '|' + clean(itemData['supplier'])    // item supplier
                        + '|' + clean(itemData['url'])         // item URL
                        + '|' // GBP notes
                        + '|' // USD notes
                        + '|' // AUD notes
                        ;
                    itemArray.push(line);
                    progressText.innerHTML = "Getting data for item " + itemData['name'];
                });
            })
            .catch(function(error) {
                // this didn't work
                console.log("Failed to get any matching documents: ", error);
            });
        // push these items to category map                           
        categoryItems.push(itemArray);
    }

    var fileStrings = [];
    line = 'database ID'
        + '|Category'
        + '|Item Name'
        + '|Quality'
        + '|Quantity'
        + '|GBP'
        + '|USD'
        + '|AUD'
        + '|Description'
        + '|Notes'
        + '|Colour'
        + '|Physical'
        + '|Supplier'
        + '|URL'
        + '|GBP notes'
        + '|USD notes'
        + '|AUD notes'
        ;
    fileStrings.push(line + '\n');
    for (var i = 0; i < categoryArray.length; ++i) {
        // for each category, get each item
        var itemArray = categoryItems[i];
        var categoryDataLine = categoryArray[i];
        var categoryId = categoryDataLine.substr(0, categoryDataLine.indexOf('|'));
        // add this line to the file
        fileStrings.push(categoryDataLine + '\n');
        // and get all the items for the category
        for (var j = 0; j < itemArray.length; ++j) {
            // for each item, get the quantities
            var itemDataLine = itemArray[j]
            // add this line to the file
            fileStrings.push(itemDataLine + '\n');
            // now get the quantities
            var itemId = itemDataLine.substr(0, itemDataLine.indexOf('|'));
            var itemRef = firebase.firestore().doc(firebaseData.collectionItems + '/' + itemId);
            await firebase.firestore().collection(firebaseData.collectionQuantities)
                .where("item_ref", "==", itemRef).orderBy('quantity').get()
                .then(function(querySnapshot) {
                    // this worked
                    querySnapshot.forEach(async function (quantityDoc) {
                        // create the quantities for each item
                        var quantityData = quantityDoc.data();
                        // create the line for this
                        line = quantityDoc.id
                            + '|' // category name
                            + '|' // item name
                            + '|' // item quality
                            + '|' + quantityData['quantity'] // quantity
                            + '|' + quantityData['gbp'] // GBP
                            + '|' + quantityData['usd'] // USD
                            + '|' + quantityData['aud'] // AUD
                            + '|' // cat/item description
                            + '|' + clean(quantityData['notes'])       // cat/item notes
                            + '|' // item colour
                            + '|' // item physical
                            + '|' // item supplier
                            + '|' // item URL
                            + '|' + clean(quantityData['gbp_notes']) // GBP notes
                            + '|' + clean(quantityData['usd_notes']) // USD notes
                            + '|' + clean(quantityData['aud_notes']) // AUD notes
                            ;
                        // add this line to the file
                        fileStrings.push(line + '\n');
                        progressText.innerHTML = "Getting price data for " + quantityData['category_name'] + " item " + quantityData['item_name'];
                    });
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to get any matching documents: ", error);
                });
        }
    }
    
    var blob = new Blob([fileStrings], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "csvFileExport.txt");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    exportButton.classList.remove('disabled');
    progressText.innerHTML = "Downloaded export file";
}