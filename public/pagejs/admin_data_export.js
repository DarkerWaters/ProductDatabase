// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

function clean(dataToClean) {
    if (!dataToClean) {
        return '';
    }
    else {
        return dataToClean.replace(/(\||\r\n|\n|\r)/gm, "");
    }
}

async function exportAllData() {
    // create an array of values to export
    var exportButton = document.querySelector('#export_data');
    var progressText = document.querySelector('#progress_text');
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
                    + '|' + clean(categoryData['image'])// image
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
                        + '|' + clean(itemData['image'])       // image
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
    // first line can define the seperator we use
    fileStrings.push('sep=|');
    // the next can be the title row
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
        + '|Image'
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
                            + '|' // image
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

var importedData;
var activeRow;

async function importAllDataRaw(event) {
    // import the raw (all) exported data, less checking but more powerful functionality
    var progressText = document.querySelector('#progress_text');
    
    progressText.innerHTML = 'picking file';
    var files = event.target.files;
    var file = files[0];
    var fileInfo = `
          - FileName: ${file.name || 'n/a'}<br>
          - FileType: ${file.type || 'n/a'}<br>
          - FileSize: ${file.size} bytes<br>
          - LastModified: ${file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a'}
        `;
    progressText.innerHTML = 'reading file';
    // request the file to load
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function (event) {
        // clear the old data
        previousValues = [];
        rowCount = 0;
        firstValid = null;
        // and load the data
        var csv = event.target.result;
        importedData = $.csv.toArrays(csv, {"separator" : '|', "delimiter" : '|'});
        // ignoring the top (header row) import each row of data
        activeRow = 0;
        processNextDataRow(progressText);
    };
}

function processNextDataRow(progressText) {
    // import the next row
    if (++activeRow >= importedData.length) {
        // we are at the end then
        progressText.innerHTML = "Data successfully loaded " + importedData.length + " rows";
    }
    else {
        if (importedData[activeRow] == 'sep=|') {
            // this is expected, but not imported
            processNextDataRow(progressText);
        }
        else {
            // import this row
            importDataRow(importedData[activeRow], progressText);
        }
    }
}

var lastCategoryDocument;
var lastItemDocument;
var lastQuantityDocument;

var categoryData;
var itemData;
var quantityData;

async function importDataRow(fileStrings, progressText) {
    // get all the data up front in one go - to be clear
    try {
        var databaseId      = !fileStrings.length > 0 ? "" : clean(fileStrings[0]);
        var categoryName    = !fileStrings.length > 1 ? "" : clean(fileStrings[1]);
        var itemName        = !fileStrings.length > 2 ? "" : clean(fileStrings[2]);
        var itemQuality     = !fileStrings.length > 3 ? "" : clean(fileStrings[3]);
        var priceQuantity   = !fileStrings.length > 4 ? "" : clean(fileStrings[4]);
        var priceGBP        = !fileStrings.length > 5 ? "" : clean(fileStrings[5]);
        var priceUSD        = !fileStrings.length > 6 ? "" : clean(fileStrings[6]);
        var priceAUD        = !fileStrings.length > 7 ? "" : clean(fileStrings[7]);
        var description     = !fileStrings.length > 8 ? "" : clean(fileStrings[8]);
        var notes           = !fileStrings.length > 9 ? "" : clean(fileStrings[9]);
        var itemColour      = !fileStrings.length > 10 ? "" : clean(fileStrings[10]);
        var itemPhysical    = !fileStrings.length > 11 ? "" : clean(fileStrings[11]);
        var itemSupplier    = !fileStrings.length > 12 ? "" : clean(fileStrings[12]);
        var itemURL         = !fileStrings.length > 13 ? "" : clean(fileStrings[13]);
        var image           = !fileStrings.length > 14 ? "" : clean(fileStrings[14]);
        var priceGBPNotes   = !fileStrings.length > 15 ? "" : clean(fileStrings[15]);
        var priceUSDNotes   = !fileStrings.length > 16 ? "" : clean(fileStrings[16]);
        var priceAUDNotes   = !fileStrings.length > 17 ? "" : clean(fileStrings[17]);
    }
    catch (error) {
        window.alert("Failed get the 18 items of data at row " + activeRow + " " + error);
    }

    if (categoryName && categoryName.length > 0) {
        progressText.innerHTML = "" + activeRow + "importing category " + categoryName;
        // this object has a category name, so it is a category
        categoryData = firebaseData.defaultCategory(clean(categoryName));
        // set all the data on this category to be as from the file
        categoryData['image']       = clean(image);
        categoryData['description'] = clean(description);
        categoryData['notes']       = clean(notes);
        // and auto-complete the data to set the search words etc
        firebaseData.autoCompleteData(categoryData);
        // and put this in firebase - waiting.
        firebase.firestore().collection(firebaseData.collectionCategories)
            .add(categoryData)
            .then(function(newDocRef) {
                // this worked
                lastCategoryDocument = newDocRef;
                processNextDataRow(progressText);
            })
            .catch(function(error) {
                // this didn't work
                window.alert("Failed to add the category " + categoryName + " process stopped at line " + activeRow + " " + error);
            });
    }
    else if (itemName && itemName.length > 0) {
        progressText.innerHTML = "" + activeRow + "importing item " + categoryData['name'] + " -- " + itemName;
        // this object has an item name so it is an item, create this item from the category data as well as the line of data
        itemData = firebaseData.defaultItem(lastCategoryDocument.id, categoryData, clean(itemName), clean(itemQuality));
        // set all the data on this item to be as from the file
        /*
        name ref and quality done from the defaultItem function
        itemData['name']            = clean(itemName);
        itemData['category_name']   = clean(categoryName);
        itemData['category_ref']    = clean(lastCategoryDocument;
        itemData['quality']         = clean(itemQuality);
        */
        itemData['colours']         = clean(itemColour);
        itemData['description']     = clean(description);
        itemData['image']           = clean(image);
        itemData['url']             = clean(itemURL);
        itemData['notes']           = clean(notes);
        itemData['physical']        = clean(itemPhysical);
        itemData['supplier']        = clean(itemSupplier);
        // and auto-complete the data to set the search words etc
        firebaseData.autoCompleteData(itemData);
        // and put this in firebase - waiting.
        firebase.firestore().collection(firebaseData.collectionItems)
            .add(itemData)
            .then(function(newDocRef) {
                // this worked
                lastItemDocument = newDocRef;
                processNextDataRow(progressText);
            })
            .catch(function(error) {
                // this didn't work
                window.alert("Failed to add the item " + itemName + " process stopped at line " + activeRow + " " + error);
            });
    }
    else if (priceQuantity && priceQuantity.length > 0) {
        // because this is quicker (not waiting) we will not show progress for this
        //progressText.innerHTML = "" + activeRow + "importing quantity for " + categoryData['name'] + " -- " + itemData['name'];
        // this object has a quantity, so that is what it is - create it from the data fro the line
        var quantityNumber = parseInt(clean(priceQuantity));
        var gbpValue = parseFloat(clean(priceGBP));
        var usdValue = parseFloat(clean(priceUSD));
        var audValue = parseFloat(clean(priceAUD));
        if (isNaN(quantityNumber) ||
            isNaN(gbpValue) ||
            isNaN(usdValue) ||
            isNaN(audValue)) {
            window.alert("Quantity data for item " + databaseId + " contains non numbers at line " + activeRow + " process stopped");
        }
        else {
            // create the default (complete quantity)
            quantityData = firebaseData.defaultQuantity(
                lastItemDocument.id, 
                itemData, 
                quantityNumber, 
                gbpValue, 
                priceGBPNotes, 
                usdValue, 
                priceUSDNotes, 
                audValue, 
                priceAUDNotes, 
                notes);
            // this sets all the data there is on this object so just auto-complete the data to set the search words etc
            firebaseData.autoCompleteData(itemData);
            // and put this in firebase - waiting.
            firebase.firestore().collection(firebaseData.collectionQuantities)
                .add(quantityData)
                .then(function(newDocRef) {
                    // this worked
                    lastQuantityDocument = newDocRef;
                })
                .catch(function(error) {
                    // this didn't work
                    window.alert("Failed to add the quantity " + databaseId + " process stopped at line " + activeRow + " " + error);
                });
            // there is no need to wait for the quality to import before proceeding
            // so just go to the next row right away for speed's sake
            processNextDataRow(progressText);
        }
    }
    else {
        // there isn't enough data in this row
        window.alert("Stopped due to missing data in row " + activeRow + " data looks like:" + fileStrings);
    }
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');

    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported, bind the button change to the function
        //$('#files').bind('change', selectPricingList);
        document.getElementById('files').style.display = null;
        document.getElementById('files').onchange = function(event) {
            importAllDataRaw(event);
        };
        return true;
    } else {
        // source: File API availability - http://caniuse.com/#feat=fileapi
        // source: <output> availability - http://html5doctor.com/the-output-element/

        var container = document.getElementById('progress_text');
        container.innerHTML += ('The HTML5 APIs used in this form are only available in the following browsers:<br />');
        // 6.0 File API & 13.0 <output>
        container.innerHTML += (' - Google Chrome: 13.0 or later<br />');
        // 3.6 File API & 6.0 <output>
        container.innerHTML += (' - Mozilla Firefox: 6.0 or later<br />');
        // 10.0 File API & 10.0 <output>
        container.innerHTML += (' - Internet Explorer: Not supported (partial support expected in 10.0)<br />');
        // ? File API & 5.1 <output>
        container.innerHTML += (' - Safari: Not supported<br />');
        // ? File API & 9.2 <output>
        container.innerHTML += (' - Opera: Not supported');
        return false;
    }
});