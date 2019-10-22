// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

function checkUserState() {
    var user = firebaseData.getUser();
    if (user) {
        // logged in - hide this
        document.getElementById('not_logged_in').style.display = 'none';
        document.getElementById('not_reader').style.display = null;
        firebaseData.getUserData(user,
            function(firebaseUserData) {
                // got the data
                if (firebaseData.isUserReader(firebaseUserData)) {
                    // we are a reader
                    document.getElementById('not_reader').style.display = 'none';
                }
                else {
                    // not a reader
                    document.getElementById('not_reader').style.display = null;
                }
            }),
            function(error) {
                // failed
                console.log('failed to get the user data to see if a reader', error);
                document.getElementById('not_reader').style.display = null;
            }
    }
    else {
        // not logged in, show this
        document.getElementById('not_logged_in').style.display = null;
        document.getElementById('not_logged_in').style.display = null;
    }
}

var categoriesFound;

function onCategoryFound(categoryContainer, resultContainer, categoryId, categoryData) {
    document.getElementById('search_results_none_container').style.display = 'none';
    if (categoriesFound.includes(categoryId)) {
        // already added
    }
    else {
        // remember we added this already
        categoriesFound.push(categoryId);
        // create a link for this found container
        var linkDiv = document.getElementById('template_category_link').cloneNode(true);
        // set the unique ID for this
        linkDiv.id = "link_category_" + categoryId;
        var links = linkDiv.getElementsByTagName('a');
        for (var i = 0; i < links.length; ++i) {
            links[i].id = "link_" + i + "_" + categoryId;
            links[i].href = "#" + categoryId;
            links[i].innerHTML = categoryData.name;
        }
        // and add to the container
        categoryContainer.appendChild(linkDiv);

        var resultDiv = document.getElementById('template_category_result').cloneNode(true);
        resultDiv.id = categoryId;
        // do the data for this
        setContainerData(resultDiv, 'category', 'name', categoryId, categoryData);
        setContainerData(resultDiv, 'category', 'description', categoryId, categoryData);
        setContainerData(resultDiv, 'category', 'notes', categoryId, categoryData);
        // and do the image
        var image = resultDiv.querySelector('#category_image');
        image.id = "category_image_" + categoryId;
        if (categoryData.image) {
            image.src = categoryData.image;
        }
        // also create the template for the category we found
        resultContainer.appendChild(resultDiv);
        var separator = document.createElement('hr');
        resultContainer.appendChild(separator);

        // we will also want to show all the items under this category
        firebaseData.getItemsInCategory(categoryId,
            function(querySnapshot) {
                // have all the items here, add them all to the category
                querySnapshot.forEach(function(doc) {
                    // for each doc (item) add the data
                    onItemFound(resultContainer, separator, doc.id, doc.data());
                })
            },
            function(error) {
                console.log('failed to find the items in a category', error);
            });
    }
}

function onItemFound(resultContainer, separator, itemId, itemData) {
    var itemDiv = document.getElementById('template_item_result').cloneNode(true);
    itemDiv.id = itemId;
    // do the data for this
    setContainerData(itemDiv, 'item', 'name', itemId, itemData);
    setContainerData(itemDiv, 'item', 'quality', itemId, itemData);
    setContainerData(itemDiv, 'item', 'description', itemId, itemData);
    setContainerData(itemDiv, 'item', 'notes', itemId, itemData);

    // and do the image
    var image = itemDiv.querySelector('#item_image');
    image.id = "item_image_" + itemId;
    if (itemData.image) {
        image.src = itemData.image;
    }

    setContainerData(itemDiv, 'item', 'physical', itemId, itemData);
    setContainerData(itemDiv, 'item', 'colours', itemId, itemData);
    setContainerData(itemDiv, 'item', 'supplier', itemId, itemData);

    // setup the table correctly
    var table = itemDiv.querySelector('#quantity_data_table');
    table.id = "prices_table_" + itemId;
    var showButton = itemDiv.querySelector('#quantity_button');
    showButton.id = "prices_button_" + itemId;
    showButton.onclick = function() {
        if (!table.style.display) {
            table.style.display = 'none';
        }
        else {
            table.style.display = null;
        }
    }
    resultContainer.insertBefore(itemDiv, separator);

    // we will also want to show all the quantities under this item
    firebaseData.getQuantitiesInItem(itemId,
        function(querySnapshot) {
            // have all the items here, add them all to the category
            querySnapshot.forEach(function(doc) {
                // for each doc (item) add the data
                onQuantityFound(table, doc.id, doc.data());
            })
        },
        function(error) {
            console.log('failed to find the quantities in an item', error);
        });
}

function onQuantityFound(table, quantityId, quantityData) {
    // add a row to the table
    var newRow = document.createElement('tr');
    newRow.id = quantityId;
    var tBody = table.getElementsByTagName('tbody')[0];
    // add the data to this row
    addTableCell(newRow, quantityData.quantity);
    addTableCell(newRow, quantityData.gbp_notes ? quantityData.gbp_notes : '£' + quantityData.gbp);
    addTableCell(newRow, quantityData.usd_notes ? quantityData.usd_notes : '$' + quantityData.usd);
    addTableCell(newRow, quantityData.aud_notes ? quantityData.aud_notes : 'AUD ' + quantityData.aud);
    addTableCell(newRow, quantityData.notes ? quantityData.notes : '');
    // and put the row into the table
    tBody.appendChild(newRow);
}

function addTableCell(row, cellData) {
    var dataElement = document.createElement('td');
    dataElement.innerHTML = cellData;
    row.appendChild(dataElement);
}

function setContainerData(parent, level, variable, id, data) {
    var divElement = parent.querySelector('#' + level + "_" + variable);
    divElement.id = level + '_' + variable + '_' + id;
    if (data[variable]) {
        divElement.innerHTML = data[variable];
    }
    else {
        divElement.innerHTML = '';
    }
    
}

function onSubmitSearch() {
    // search the selected categories for matches, find all the categories to show from those matched
    var categoryContainer = document.getElementById('found_categories');
    var resultContainer = document.getElementById('search_results_container');
    var searchTerm = document.getElementById('search').value;
    // clear all the old data
    resultContainer.innerHTML = "";
    document.getElementById('search_results_none_container').style.display = null;
    categoryContainer.innerHTML = "";
    categoriesFound = [];

    if (document.getElementById('search_categories').checked) {
        // search for categories
        firebaseData.searchCollectionForWord(firebaseData.collectionCategories, searchTerm,
            function(querySnapshot) {
                // success, add all to the HTML
                querySnapshot.forEach(function (doc) {
                    // show each of these found documents in the HTML
                    onCategoryFound(categoryContainer, resultContainer, doc.id, doc.data())
                });
            },
            function (error) {
                // failed
                console.log('searching failed: ', error);
            });
    }
    if (document.getElementById('search_items').checked) {
        // search for categories
        firebaseData.searchCollectionForWord(firebaseData.collectionItems, searchTerm,
            function(querySnapshot) {
                // success, add all to the HTML
                querySnapshot.forEach(function (doc) {
                    // show each of the categories of the item in the HTML
                    loadCategoryData(doc.data().category_ref);
                });
            },
            function (error) {
                // failed
                console.log('searching failed: ', error);
            });
    }
    if (document.getElementById('search_quantities').checked) {
        // search for categories
        firebaseData.searchCollectionForWord(firebaseData.collectionItems, searchTerm,
            function(querySnapshot) {
                // success, add all to the HTML
                querySnapshot.forEach(function (doc) {
                    // show each of the categories of the item in the HTML
                    loadCategoryData(doc.data().category_ref);
                });
            },
            function (error) {
                // failed
                console.log('searching failed: ', error);
            });
    }
}

function loadCategoryData(categoryRef) {
    var categoryContainer = document.getElementById('found_categories');
    var resultContainer = document.getElementById('search_results_container');
    firebaseData.getCategoryById(categoryRef.id, 
        function(doc) {
            // got it
            onCategoryFound(categoryContainer, resultContainer, doc.id, doc.data())
        },
        function(error) {
            // failed
            console.log('category not found: ', error);
        });
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');

    const node = document.getElementById("search");
    node.addEventListener("keyup", function(event) {
        if (event.key === "Enter") {
            onSubmitSearch();
        }
    });
    checkUserState();			
});