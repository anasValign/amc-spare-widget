var customerData;
var installationRecordData;
var productData;
var productAgeing;
var selectedType;
var $product_name;
var $product_code;
var allProductData;
var ownerData;
var currentUser;

$(document).ready(function () {
    try {

        ZOHO.embeddedApp.on("PageLoad", async function (data) {

            console.log("PageLoad on load", data)

            ZOHO.CRM.CONFIG.getCurrentUser().then(function (data) {
                if (data?.users) {
                    currentUser = data?.users[0]
                }
                console.log("current user - ", currentUser);
            });

            // for showing initial loader
            $("#loaderDiv").css("display", "flex");
            $("#body").css("display", "none");

            if (data.EntityId > 0) {
                const installationData = await getInstallationRecordsById(data);

                // console.log("installationData", installationData);
                // ? calling the function here only for customer and product
                await getCustomerById(installationData?.Service_Item)
                await getProductById(installationData?.Product)
                await getOwnerInfo(installationData?.Owner_1, installationData?.Owner)

            } else {
                console.warn("no entity Id found in PageLoad")
            }

            // getting values more than 200 using coql
            let config = {
                "select_query": "select id, Product_Code, Product_Name, Unit_Price, Created_Time from Products where Product_Classification_C = 'Spare' and Product_Active = true order by id desc limit 2000",
                "version": 4
            };
            ZOHO.CRM.API.coql(config).then(function (data) {
                allProductData = data?.data
                // console.log("allProductData length -> ", allProductData.length)
                addRow({}, $('#spareTableBody').find('tr').length)
            })
        })
        ZOHO.embeddedApp.init();

        $('#noDataModal').on('hidden.bs.modal', function () {
            $('#type_input').val('');
            $('#based_on_type').addClass('d-none');
            $('#spare_type').addClass('d-none');
        });

        $('#spare_type').addClass('d-none');
        $('#based_on_type').addClass('d-none');
        $('#new_amc_contract_year_div').addClass('d-none');
        $('#amc_start_date_div').addClass('d-none');
        $('#amc_end_date_div').addClass('d-none');
        $('#pricing_div').addClass('d-none');
        $('#deviation_pricing_div').addClass('d-none');
        $('#product_name_lookup_lable').text('Product Name');

        $('#type_input').change(function () {
            selectedType = $(this).val();
            if (selectedType === 'Spare') {
                $('#new_amc_contract_year_div').addClass('d-none');
                $('#amc_start_date_div').addClass('d-none');
                $('#amc_end_date_div').addClass('d-none');
                $('#pricing_div').addClass('d-none');
                $('#deviation_pricing_div').addClass('d-none');
                $('#spare_type').removeClass('d-none');
                $('#based_on_type').removeClass('d-none');
                $('#product_name_lookup_lable').text('Equipment Name');

                if ($('#spareTableBody').find('tr').length === 0) {
                    addRow({}, $('#spareTableBody').find('tr').length)
                }
                checkAllRequiredFieldClass();
            } else if (selectedType === 'AMC' || selectedType === 'CMC' || selectedType === 'AGAMC') {
                $('#new_amc_contract_year_div').removeClass('d-none');
                $('#amc_start_date_div').removeClass('d-none');
                $('#amc_end_date_div').removeClass('d-none');
                $('#pricing_div').removeClass('d-none');
                $('#deviation_pricing_div').removeClass('d-none');
                $('#spare_type').addClass('d-none');
                $('#based_on_type').removeClass('d-none');
                $('#product_name_lookup_lable').text('Product Name');

                removeAllRows();
                checkAllRequiredFieldClass();
                // console.log("payload for product aging -> ", selectedType, productData?.id);

                const payload = {
                    module: 'Product_Ageing',
                    id: productData?.id,
                    type_Of_Contract: selectedType,
                }
                getProductAging(payload);
            } else {
                $('#based_on_type').addClass('d-none');
                $('#spare_type').addClass('d-none');
                // $('#product_name_lookup_lable').text('Product Name');
            }
        });

        $('#addRowToSpareBtn').click(function () {
            addRow({}, $('#spareTableBody').find('tr').length);
        });

        // setTimeout(() => {
        //     $("#loaderDiv").css("display", "none");
        //     $("#body").css("display", "flex");
        // }, 5000)
    } catch (error) {
        console.log("Internal error when doc is ready --> ", error)
    }
})

async function onFormSubmit(event) {
    event.preventDefault(); // Prevent the default form submission

    try {
        let isValid = true;

        const requiredFields = document.querySelectorAll('.required-field');

        const form = event.target;
        const formData = new FormData(form);

        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // ! get all the disabled field form data
        data['installed_customer_name_input'] = $('#installed_customer_name_input').val();
        data['installed_customer_code_input'] = $('#installed_customer_code_input').val();
        data['serial_no_input'] = $('#serial_no_input').val();
        // data['service_item_number_input'] = $('#service_item_number_input').val();
        data['hq_name_input'] = $('#hq_name_input').val();
        data['product_name_lookup_input'] = $('#product_name_lookup_input').val();
        data['service_item_owner_input'] = $('#service_item_owner_input').val();
        // data['installation_id_input'] = $('#installation_id_input').val();
        data['warranty_type_input'] = $('#warranty_type_input').val();
        data['status_input'] = $('#status_input').val();
        data['previous_contract_end_date_input'] = $('#previous_contract_end_date_input').val();
        data['installation_date_input'] = $('#installation_date_input').val();
        data['pricing_input'] = $('#pricing_input').val();

        delete data['spare_product_code_input'];
        delete data['spare_product_name_input'];

        // ? push to Quote_Info
        if (data?.type_input === 'Spare') {

            delete data['pricing_input'];
            delete data['deviation_pricing_input'];
            delete data['new_amc_contract_year_input'];
            delete data['amc_start_date_input'];
            delete data['amc_end_date_input'];

            const spareData = getFormValues().map((sparesElem) => {
                return {
                    Product_Name: sparesElem?.product,
                    Product_Code: sparesElem?.code,
                    Unit_Price: sparesElem?.unitPrice,
                    Quantity: sparesElem?.quantity,
                    Amount: sparesElem?.amount,
                    Quoting_Price: sparesElem?.quotingPrice,
                    Percentage: parseFloat((+sparesElem?.quotingPrice / +sparesElem?.amount).toFixed(4) * 100).toFixed(2),
                }
            });

            const greatestPercentage = spareData.reduce((max, item) => +item.Percentage > +max.Percentage ? item : max, spareData[0]);

            $('#spareTableBody').find('tr').each(function (index, row) {
                const productNameInput = $(row).find('.spare_product_name_input');
                const productCodeInput = $(row).find('.spare_product_code_input');
                const quantityInput = $(row).find('.spare_qty_input');
                const quotingPriceInput = $(row).find('.quoting_price');

                if (!validateField(productNameInput) || !validateField(productCodeInput) || !validateField(quantityInput) || !validateField(quotingPriceInput)) {
                    isValid = false;
                    return;
                }
            });

            var req_data = {
                "parameters": {
                    "Trigger": ["workflow", "blueprint"],
                    "data": [
                        {
                            "Owner": currentUser?.id,
                            "Modified_By": currentUser?.id,
                            "Created_By": currentUser?.id,
                            "Type": data['type_input'],
                            "Installation_Date": data['installation_date_input'],
                            "Installed_Customer_Code": data['installed_customer_code_input'],
                            "Installed_Customer_Name": data['installed_customer_name_input'],
                            "Customer_Code": customerData['Customer_Code'],
                            "Customer_Name": customerData['id'],
                            "Installation_ID": installationRecordData['Installation_ID'],
                            "Quote_Name": `${customerData?.Account_Name} Quotes`,
                            "Product_Name": data['product_name_lookup_input'],
                            "Product_Code": productData['Product_Code'],
                            "Previous_Contract_End_Date": data['previous_contract_end_date_input'],
                            "Serial_No": data['serial_no_input'],
                            "Service_Item_Number": installationRecordData['Serial_No'],
                            "HQ_Name": data['hq_name_input'],
                            "Warranty_Type": data['warranty_type_input'],
                            // "Percentage": parseFloat((+$('#totalQuotingPrice').text() / +$('#totalAmount').text()).toFixed(2)),
                            "Owner_Division": ownerData?.Division,
                            "Owner_HQ": ownerData?.HQ?.id,
                            "Owner_Region": ownerData?.Region,
                            "Owner_Role": ownerData?.Role,
                            "Owner_Zone": ownerData?.Zone,
                            "Approval_Status": "Quote Submitted",
                            "Percentage": parseFloat(greatestPercentage?.Percentage).toFixed(2),
                            "Spare_Parts_Information": spareData
                        }
                    ]
                },
                "method": "POST", // GET
                "url": "https://www.zohoapis.in/crm/v6/Quote_Info",
                "param_type": 2 // 1
            };

            if (isValid) {
                console.log(req_data);
                const spareResult = await ZOHO.CRM.CONNECTION.invoke("widget_connection", req_data);
                console.log(spareResult, spareResult?.details, spareResult?.details?.status);
                if (spareResult?.details?.status == 'true' && spareResult?.details?.statusMessage?.data.length > 0) {
                    closePopReload();
                }
            }

        } else {

            requiredFields.forEach(field => {
                const errorElementId = field.getAttribute('data-error');
                const errorElement = document.getElementById(errorElementId);

                if ((!field.value && !field.disabled) || (field.value === '' && !field.disabled)) {
                    errorElement.classList.remove('d-none');
                    isValid = false;
                    return;
                } else {
                    errorElement.classList.add('d-none');
                }
            });

            // validating dates
            if (data['amc_start_date_input'] < data['previous_contract_end_date_input']) {
                isValid = false;
            }
            let contractStartDate = new Date(data['amc_start_date_input']);
            contractStartDate.setFullYear(contractStartDate.getFullYear() + +data['new_amc_contract_year_input']);
            contractStartDate.setDate(contractStartDate.getDate() - 1);
            let newStartDate = formatDate(contractStartDate);
            if (newStartDate > data['amc_end_date_input']) {
                isValid = false;
            }

            let totalPrice = data['pricing_input'] && +data['pricing_input'] != 0 ? +data['pricing_input'] + (+data['pricing_input'] * 0.18) : +data['deviation_pricing_input'] + (+data['deviation_pricing_input'] * 0.18);

            console.log("totalPrice -->| ", totalPrice, data['pricing_input'] && +data['pricing_input'] != 0, +data['pricing_input']);

            var recordDataAMC_CMC_AGAMC = {
                "Type": data['type_input'],
                "Installation_Date": data['installation_date_input'],
                "Installed_Customer_Code": data['installed_customer_code_input'],
                "Installed_Customer_Name": data['installed_customer_name_input'],
                "Customer_Code": customerData['Customer_Code'],
                "Customer_Name": customerData['id'],
                "Installation_ID": installationRecordData['Installation_ID'],
                "Quote_Name": `${customerData?.Account_Name} Quotes`,
                "Product_Name": data['product_name_lookup_input'],
                "Product_Code": productData['Product_Code'],
                "Previous_Contract_End_Date": data['previous_contract_end_date_input'],
                "Serial_No": data['serial_no_input'],
                "Service_Item_Number": installationRecordData['Serial_No'],
                "HQ_Name": data['hq_name_input'],
                "Warranty_Type": data['warranty_type_input'],
                "AMC_start_Date": data['amc_start_date_input'],
                "AMC_End_date": data['amc_end_date_input'],
                "Pricing": data['pricing_input'],
                "Deviation_Price": data['deviation_pricing_input'],
                "AMC_CMC_AGAMC_Contract_Year": data['new_amc_contract_year_input'],
                "Owner_Division": ownerData?.Division,
                "Owner_HQ": ownerData?.HQ?.id,
                "Owner_Region": ownerData?.Region,
                "Owner_Role": ownerData?.Role,
                "Owner_Zone": ownerData?.Zone,
                "Total_Price": +totalPrice.toFixed(2),
                "Approval_Status": "Quote Submitted",
                // "Percentage": "",
            }

            if (isValid) {
                console.log(recordDataAMC_CMC_AGAMC);
                const result = await ZOHO.CRM.API.insertRecord({ Entity: "Quote_Info", APIData: recordDataAMC_CMC_AGAMC, Trigger: ["workflow", "blueprint"] });
                if (result?.data) {
                    console.log(result, result?.data);
                    closePopReload();
                }
            }
        }
    } catch (error) {
        console.log("error while submitting the form -> ", error)
    }
}

// only for remove the error message while switching the type
function checkAllRequiredFieldClass() {
    const requiredFields = document.querySelectorAll('.required-field');

    requiredFields.forEach(field => {
        const errorElementId = field.getAttribute('data-error');
        const errorElement = document.getElementById(errorElementId);
        errorElement.classList.add('d-none');
    });
}

$('#spareTableBody').on('click', '.delete-btn', function () {
    $(this).closest('tr').remove();
    toggleDeleteButtons();
    toggleTFoot();
    updateTotalAmount();
});

$('#amc_start_date_input').on('change', function () {

    let selectedDate = new Date($(this).val());
    // console.log(selectedDate, selectedDate.getFullYear(), $('#new_amc_contract_year_input').val())
    // Subtract years
    selectedDate.setFullYear(selectedDate.getFullYear() + +$('#new_amc_contract_year_input').val());
    // Subtract days
    selectedDate.setDate(selectedDate.getDate() - 1);

    // amc end date
    let formattedDate = formatDate(selectedDate);
    $('#amc_end_date_input').attr("min", formattedDate);
    $('#amc_end_date_input').val(formattedDate);

    $('#amc_end_date_input_error').addClass('d-none');
    $('#amc_end_date_input_error').text('Please select start date.');

    calcProductAging();
});

$('#new_amc_contract_year_input').on('change', function () {
    // console.log($('#amc_start_date_input').val(), $(this).val())
    if ($('#amc_start_date_input').val()) {
        let selectedDate = new Date($('#amc_start_date_input').val());
        // Subtract years
        selectedDate.setFullYear(selectedDate.getFullYear() + +$(this).val())
        // Subtract days
        selectedDate.setDate(selectedDate.getDate() - 1);

        let formattedDate = formatDate(selectedDate);
        $('#amc_end_date_input').attr("min", formattedDate);
        $('#amc_end_date_input').val(formattedDate);
    }

    $('#amc_end_date_input_error').addClass('d-none');
    $('#amc_end_date_input_error').text('Please select start date.');

    calcProductAging();
})

function calcProductAging() {

    const instDateYear = new Date($('#installation_date_input').val()).getFullYear();
    const newContractYear = +$('#new_amc_contract_year_input').val();
    const amcStartDate = new Date($('#amc_start_date_input').val()).getFullYear();
    const $pricingInput = $('#pricing_input');
    let priceAging = 0;

    // console.log(instDateYear, newContractYear, amcStartDate)

    if (instDateYear && newContractYear && amcStartDate) {
        if (instDateYear < amcStartDate) {
            let diffOfInstallationYear = amcStartDate - instDateYear;
            let contractEndYear = diffOfInstallationYear + newContractYear;
            // console.log(diffOfInstallationYear, contractEndYear, productAgeing);

            if (contractEndYear - diffOfInstallationYear > 1) {
                for (let x = contractEndYear; x > diffOfInstallationYear; x--) {
                    // console.log("EXCEEDED 1 year, start adding years.", x)
                    priceAging += priceAgingConditions(x - 1);
                }
                if (+priceAging > 0) {
                    $('#pricing_input').attr('disabled', true);
                    $('#pricing_input').addClass('required-field');
                    $('#deviation_pricing_input').removeClass('required-field');
                    $('#deviation_pricing_input').val(0);
                    $('#deviation_pricing_input_error').addClass('d-none');
                } else {
                    $('#pricing_input').attr('disabled', true);
                    $('#pricing_input').removeClass('required-field');
                    $('#deviation_pricing_input').addClass('required-field');
                    $('#deviation_pricing_input').val(undefined);
                    // $('#deviation_pricing_input_error').removeClass('d-none');
                }
                $pricingInput.val(priceAging);
                return;
            }
            priceAging += priceAgingConditions(diffOfInstallationYear);
        }
    }
    // console.log("final price ->| ", priceAging);
    if (+priceAging > 0) {
        $('#pricing_input').attr('disabled', true);
        $('#pricing_input').addClass('required-field');
        $('#deviation_pricing_input').val(0);
        $('#deviation_pricing_input').removeClass('required-field');
        $('#deviation_pricing_input_error').addClass('d-none');
    } else {
        $('#pricing_input').attr('disabled', true);
        $('#pricing_input').removeClass('required-field');
        $('#deviation_pricing_input').addClass('required-field');
        $('#deviation_pricing_input').val(undefined);
        // $('#deviation_pricing_input_error').removeClass('d-none');
    }
    $pricingInput.val(priceAging);
}

function priceAgingConditions(years) {
    switch (years) {
        case 1:
            // console.log("1 year", productAgeing?.Year_2)
            return productAgeing?.Year_2 ? productAgeing?.Year_2 : 0;
        case 2:
            // console.log("2 year", productAgeing?.Year_2)
            return productAgeing?.Year_2 ? productAgeing?.Year_2 : 0;
        case 3:
            // console.log("3 year", productAgeing?.Year_3)
            return productAgeing?.Year_3 ? productAgeing?.Year_3 : 0;
        case 4:
            // console.log("4 year", productAgeing?.Year_4)
            return productAgeing?.Year_4 ? productAgeing?.Year_4 : 0;
        case 5:
            // console.log("5 year", productAgeing?.Year_5)
            return productAgeing?.Year_5 ? productAgeing?.Year_5 : 0;
        case 6:
            // console.log("6 year", productAgeing?.Year_6)
            return productAgeing?.Year_6 ? productAgeing?.Year_6 : 0;
        case 7:
            // console.log("7 year", productAgeing?.Year_7)
            return productAgeing?.Year_7 ? productAgeing?.Year_7 : 0;
        case 8:
            // console.log("8 year", productAgeing?.Year_8)
            return productAgeing?.Year_8 ? productAgeing?.Year_8 : 0;
        case 9:
            // console.log("9 year", productAgeing?.Year_9)
            return productAgeing?.Year_9 ? productAgeing?.Year_9 : 0;
        case 10:
            // console.log("10 year", productAgeing?.Year_10)
            return productAgeing?.Year_10 ? productAgeing?.Year_10 : 0;
        default:
            $('#pricing_input').attr('disabled', true);
            $('#deviation_pricing_input').addClass('required-field');
            $('#deviation_pricing_input_error').removeClass('d-none');
            return 0;
    }
}

$("#cancelFormBtn").on("click", function () {
    closePopReload();
});

function formatDate(date) {
    let year = date.getFullYear();
    let month = ('0' + (date.getMonth() + 1)).slice(-2);
    let day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

// Function to remove all rows from the table
function removeAllRows() {
    $('#spareTableBody').empty();
}

// Function to add a new row to the table
function addRow(item = {}, index) {
    const newRow = `
        <tr>
            <td>
            <div class="form-group row w-100" id="spare_product_name_div_${index}">
                <select class="form-control spare_product_name_input selectpicker" name="spare_product_name_input" data-index="${index}" data-live-search="true" onchange="validateField(this)">
                <option value="">Select</option>
                </select>
                <div class="text-danger d-none fs-7" id="spare_product_name_error_${index}">Product name is required</div>
            </div>
            </td>
            <td>
            <div class="form-group row w-100" id="spare_product_code_div_${index}">
                <select class="form-control spare_product_code_input selectpicker" name="spare_product_code_input" data-index="${index}" data-live-search="true" onchange="validateField(this)">
                <option value="">Select</option>
                </select>
                <div class="text-danger d-none fs-7" id="spare_product_code_error_${index}">Product code is required</div>
            </div>
            </td>
            <td class="unit_price_input"></td>
            <td>
                <input type="number" class="form-control spare_qty_input quantity_input" onchange="validateField(this)" data-index="${index}"/>
                <div class="text-danger d-none fs-7" id="spare_qty_error_${index}">Quantity must be greater than 0</div>    
            </td>
            <td class="amount_input"></td>
            <td>
                <input type="number" class="form-control quoting_price" onchange="validateField(this)" data-index="${index}"/>
                <div class="text-danger d-none fs-7" id="quoting_price_error_${index}">Quoting price must be greater than 0</div>
            </td>
            <td><span class="btn btn-danger delete-btn">Delete</span></td>
        </tr>
        `;

    $('#spareTableBody').append(newRow);

    const $lastRow = $('#spareTableBody').find('tr').last();
    populateSelectOptions($lastRow.find('.spare_product_name_input'), "product", item.product);
    populateSelectOptions($lastRow.find('.spare_product_code_input'), "code", item.code);
    $lastRow.find('.unit_price_input').text('--');
    $lastRow.find('.quantity_input').val(0);
    $lastRow.find('.amount_input').text('--');

    // Add event listeners for the new row
    synchronizeDropdowns($lastRow);

    toggleDeleteButtons();

    toggleTFoot();

    updateTotalAmount();

    // Initialize Bootstrap Select for the new select elements
    // $lastRow.find('.selectpicker').selectpicker();
}

// Function to toggle delete buttons
function toggleDeleteButtons() {
    const rowCount = $('#spareTableBody').find('tr').length;
    if (rowCount > 1) {
        $('.delete-btn').show();
    } else {
        $('.delete-btn').hide();
    }
}

function validateField(element) {
    const value = $(element).val();
    const index = $(element).data('index');
    let isValid = true;

    if ($(element).hasClass('spare_product_name_input')) {
        if (!value) {
            $(`#spare_product_name_error_${index}`).removeClass('d-none');
            isValid = false;
        } else {
            $(`#spare_product_name_error_${index}`).addClass('d-none');
        }

        setTimeout(() => {
            // Also validate and remove error for spare_product_code_input if value changes
            const productCodeInput = $(`select.spare_product_code_input[data-index="${index}"]`);
            if (productCodeInput.val()) {
                $(`#spare_product_code_error_${index}`).addClass('d-none');
            }
        })
    }

    if ($(element).hasClass('spare_product_code_input')) {
        if (!value) {
            $(`#spare_product_code_error_${index}`).removeClass('d-none');
            isValid = false;
        } else {
            $(`#spare_product_code_error_${index}`).addClass('d-none');
        }

        setTimeout(() => {
            // Also validate and remove error for spare_product_name_input if value changes
            const productNameInput = $(`select.spare_product_name_input[data-index="${index}"]`);
            if (productNameInput.val()) {
                $(`#spare_product_name_error_${index}`).addClass('d-none');
            }
        });
    }

    if ($(element).hasClass('spare_qty_input')) {
        if (!value || value <= 0) {
            $(`#spare_qty_error_${index}`).removeClass('d-none');
            isValid = false;
        } else {
            $(`#spare_qty_error_${index}`).addClass('d-none');
        }
    }

    if ($(element).hasClass('quoting_price')) {
        if (!value || value <= 0) {
            $(`#quoting_price_error_${index}`).removeClass('d-none');
            isValid = false;
        } else {
            $(`#quoting_price_error_${index}`).addClass('d-none');
        }
    }

    return isValid;
}


// Ensure this function is included and called appropriately
// function fetchData() {
//     // Fetch data from the API and populate the first row
//     populateSelectOptions($('#spareTableBody').find('.spare_product_name_input').first(), "product");
//     populateSelectOptions($('#spareTableBody').find('.spare_product_code_input').first(), "code");

//     // Synchronize the first row dropdowns
//     synchronizeDropdowns($('#spareTableBody').find('tr').first());

//     // Initialize Bootstrap Select for the first row
//     $('#spareTableBody').find('.selectpicker').first().selectpicker();
// }

// Function to toggle total
function toggleTFoot() {
    const rowCount = $('#spareTableBody').find('tr').length;
    // console.log(rowCount);
    if (rowCount === 0) {
        $('tfoot').hide();
    } else {
        $('tfoot').show();
    }
}

// Function to populate select options based on type
function populateSelectOptions($select, type) {
    $select.empty();
    $select.append(new Option("Select", ""));
    allProductData.forEach(item => {
        if (type === "product") {
            $select.append(new Option(item.Product_Name, item.id));
        } else if (type === "code") {
            $select.append(new Option(item.Product_Code, item.Product_Code));
        }
    });
}

// Function to get all form values
function getFormValues() {
    const rows = $('#spareTableBody').find('tr');
    let formData = [];

    rows.each(function () {
        const row = $(this);
        const product = row.find('.spare_product_name_input').val();
        const code = row.find('.spare_product_code_input').val();
        const unitPrice = row.find('.unit_price_input').text();
        const quantity = row.find('.quantity_input').val();
        const amount = row.find('.amount_input').text();
        const quotingPrice = row.find('.quoting_price').val();

        formData.push({
            product,
            code,
            unitPrice,
            quantity,
            amount,
            quotingPrice
        });
    });

    return formData;
}

// Function to synchronize dropdowns within a row
function synchronizeDropdowns($row) {
    const $productSelect = $row.find('.spare_product_name_input');
    const $codeSelect = $row.find('.spare_product_code_input');
    const $qty = $row.find('.quantity_input');
    const $unitPriceInput = $row.find('.unit_price_input');
    const $amount = $row.find('.amount_input');
    const $quotingPrice = $row.find('.quoting_price');
    let $quotingPriceVal = $quotingPrice.val()

    $qty.on('input', function () {
        const enteredQty = $(this).val();
        // console.log(enteredQty, +$unitPriceInput.text(), +$quotingPriceVal);
        $amount.text(enteredQty * +$unitPriceInput.text())
        updateTotalAmount();
    })

    $quotingPrice.on('input', function () {
        const enteredQuotingPrice = $(this).val();
        // console.log(enteredQuotingPrice, +$qty.val(), $quotingPriceVal);
        updateTotalAmount();
    })

    $productSelect.on('change', function () {
        const selectedProduct = $(this).val();
        const selectedItem = allProductData.find(item => item.id === selectedProduct);
        if (selectedItem) {
            $codeSelect.val(selectedItem.Product_Code);
            $unitPriceInput.text(selectedItem.Unit_Price);
            $amount.text(+$qty.text() * +$unitPriceInput.text());
            // console.log(typeof $qty.text(), +$qty.text(), $qty.text(), +$unitPriceInput.text());
            updateTotalAmount();
        }
    });

    $codeSelect.on('change', function () {
        const selectedCode = $(this).val();
        const selectedItem = allProductData.find(item => item.Product_Code === selectedCode);
        if (selectedItem) {
            $productSelect.val(selectedItem.id);
            $unitPriceInput.text(selectedItem.Unit_Price);
            $amount.text(+$qty.text() * +$unitPriceInput.text())
            // console.log(typeof $qty.text(), +$qty.text(), $qty.text(), +$unitPriceInput.text());
            updateTotalAmount();
        }
    });
}

function updateTotalAmount() {
    let total = 0;
    let totalQuotingPrice = 0;
    $('#spareTableBody').find('tr').each(function () {
        const amount = parseFloat($(this).find('.amount_input').text());
        total += isNaN(amount) ? 0 : amount;
        const quotingPrice = parseFloat($(this).find('.quoting_price').val());
        totalQuotingPrice += isNaN(quotingPrice) ? 0 : quotingPrice;
    });
    $('#totalAmount').text(total);
    $('#totalQuotingPrice').text(totalQuotingPrice);
}

function validateStartDate() {
    // installationRecordData?.Final_Contract_End_Date 
    const minDate = $('#amc_start_date_input').attr('min');
    const selectedDate = $('#amc_start_date_input').val();

    if (selectedDate < minDate) {
        // console.log("selectedDate", selectedDate, "minDate", minDate, /^\d{4}-\d{2}-\d{2}$/.test(selectedDate));
        // $('#amc_start_date_input').val(''); // Clear the input or reset to minDate
        $('#amc_start_date_input_error').text('Please select a date which is greater than Previous Contract End Date')
        $('#amc_start_date_input_error').removeClass('d-none');
    } else {
        $('#amc_start_date_input_error').text('');
        // console.log("date is valid selectedDate", selectedDate, "minDate", minDate, /^\d{4}-\d{2}-\d{2}$/.test(selectedDate));
        $('#amc_start_date_input_error').addClass('d-none');
        $('#amc_start_date_input_error').text('Please select start date.');
    }
}

function validateEndDate() {
    // installationRecordData?.Final_Contract_End_Date 
    const minDate = $('#amc_end_date_input').attr('min');
    const minDateSplit = minDate.split('-');
    const selectedDate = $('#amc_end_date_input').val();
    console.log(minDate, minDateSplit, selectedDate);
    if (selectedDate < minDate) {
        // console.log("selectedDate", selectedDate, "minDate", minDate, /^\d{4}-\d{2}-\d{2}$/.test(selectedDate));
        // $('#amc_start_date_input').val(''); // Clear the input or reset to minDate
        $('#amc_end_date_input_error').text(`Please select the end date as ${minDateSplit[1]}-${minDateSplit[2]}-${minDateSplit[0]} according to Contract Start Date & Contract Year`)
        $('#amc_end_date_input_error').removeClass('d-none');
    } else {
        $('#amc_end_date_input_error').text('');
        // console.log("date is valid selectedDate", selectedDate, "minDate", minDate, /^\d{4}-\d{2}-\d{2}$/.test(selectedDate));
        $('#amc_end_date_input_error').addClass('d-none');
        $('#amc_end_date_input_error').text('Please select start date.');
    }
}

function closePopReload() {
    ZOHO.CRM.UI.Popup.closeReload().then(function (data) {
        console.log(data);
    });
}

// Ensure to call fetchData() after the page loads
// $(document).ready(function () {
//     fetchData();
// });