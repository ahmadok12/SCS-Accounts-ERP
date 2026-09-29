/**
 * Standalone Client Storage Engine for SCS Accounts ERP
 * Enables complete offline / serverless operation on GitHub Pages (or static hosts)
 * without requiring any external database or backend server.
 */
(function() {
  const STORAGE_KEY = 'scs_erp_data';
  const INITIAL_SEED = {"currencies":[{"code":"RMB","name":"Chinese Yuan","symbol":"¥","rateType":"base","defaultRate":1,"isBase":true,"createdAt":"Sep 3, 2026"},{"code":"USD","name":"US Dollar","symbol":"$","rateType":"greater","defaultRate":6.75,"isBase":false,"createdAt":"Sep 3, 2026"},{"code":"EUR","name":"Euro","symbol":"€","rateType":"greater","defaultRate":7.8,"isBase":false,"createdAt":"Sep 3, 2026"},{"code":"GBP","name":"British Pound","symbol":"£","rateType":"greater","defaultRate":9.15,"isBase":false,"createdAt":"Sep 3, 2026"},{"code":"PKR","name":"Pakistani Rupee","symbol":"Rs","rateType":"smaller","defaultRate":39,"isBase":false,"createdAt":"Sep 3, 2026"}],"customers":[{"id":"CUST-0001","name":"Alexander Vance","company":"Apex Global Trade Ltd","mobile":"+86 138 0011 2233","address":"Suite 402, Yiwu International Trade City","wechat":"","email":"","details":"","createdAt":"Sep 2, 2026"},{"id":"CUST-0002","name":"Sarah Jenkins","company":"Nordic Sourcing Hub","mobile":"+44 7911 123456","address":"74 King Street, Manchester, UK","wechat":"","email":"","details":"","createdAt":"Sep 2, 2026"},{"id":"CUST-0003","name":"Tariq Mehmood","company":"Al-Rayan Imports LLC","mobile":"+971 50 123 4567","address":"Deira Business Center, Dubai, UAE","wechat":"","email":"","details":"","createdAt":"Sep 3, 2026"},{"id":"CUST-0005","name":"Zubair","company":"—","mobile":"03006985555","address":"lahore","wechat":"","email":"","details":"","createdAt":"Sep 3, 2026"},{"id":"CUST-0006","name":"Adnan Khan","company":"Denontek","mobile":"030008784894","address":"sahiwal","wechat":"","email":"","details":"","createdAt":"Sep 9, 2026"}],"orders":[{"id":"ORD-0001","name":"Yiwu Kitchenware Sourcing #104","customerId":"CUST-0001","customerName":"Alexander Vance","details":"5,000 sets stainless steel lunchboxes + food-grade silicone lids. Direct factory packing.","invoiceAmount":45637.5,"receivedToDate":47325.58139534884,"receivableBalance":0,"expensesSoFar":1800,"profit":43837.5,"currentStatus":"Order Placed","statusColor":"indigo","createdAt":"Sep 2, 2026"},{"id":"ORD-0002","name":"Shenzhen Bluetooth ANC Headphones Batch A","customerId":"CUST-0002","customerName":"Sarah Jenkins","details":"2,000 units over-ear active noise canceling headsets with customized brand packaging and CE/FCC certs.","invoiceAmount":120000,"receivedToDate":120000,"receivableBalance":0,"expensesSoFar":2520,"profit":117480,"currentStatus":"Order Placed","statusColor":"indigo","createdAt":"Sep 2, 2026"},{"id":"ORD-0003","name":"lint remover","customerId":"CUST-0005","customerName":"Zubair","details":"—","invoiceAmount":10500,"receivedToDate":6976.74,"receivableBalance":3523.26,"expensesSoFar":100,"profit":10400,"currentStatus":"Order Placed","statusColor":"indigo","createdAt":"Sep 3, 2026"},{"id":"ORD-0004","name":"School bells","customerId":"CUST-0006","customerName":"Adnan Khan","details":"100 School bells","invoiceAmount":0,"receivedToDate":0,"receivableBalance":0,"expensesSoFar":0,"profit":0,"currentStatus":"Order Placed","statusColor":"indigo","createdAt":"Sep 9, 2026"}],"quotes":[{"id":"QUO-0001","date":"2026-09-02","orderId":"ORD-0001","orderName":"Yiwu Kitchenware Sourcing #104","customerId":"CUST-0001","customerName":"Alexander Vance","products":[{"id":1,"name":"Double-wall Vacuum Tumbler 500ml","pic":"☕","qty":2500,"price":14.5,"amount":36250,"includesShipping":true},{"id":2,"name":"Silicone Straw Cleaning Set","pic":"📦","qty":2500,"price":2.2,"amount":5500,"includesShipping":false}],"prodCurrency":"RMB","prodRate":1,"prodTotal":41750,"services":[{"id":1,"name":"Pre-Shipment Inspection (QC)","type":"fixed","value":1800,"amount":1800,"amountRmb":1800},{"id":2,"name":"Sourcing Commission Fee","type":"percent","value":5,"amount":2087.5,"amountRmb":2087.5}],"servCurrency":"RMB","servRate":1,"servTotal":3887.5,"shipping":{"method":"By Sea","fromLocation":"Yiwu","toLocation":"Karachi Warehouse","transitDays":"","tracking":"","amount":0},"shippingCurrency":"RMB","shippingRate":1,"shippingTotal":0,"packing":[{"id":1,"w":45,"l":55,"d":35,"unit":"cm","weight":14.5,"boxes":50,"totalWeight":725,"totalCbm":4.3313}],"totalBoxes":50,"totalWeight":725,"totalCbm":4.3313,"grandTotal":45637.5,"customerCurrency":"PKR","customerRate":43,"customerTotal":1962412.5,"status":"Approved","invoiceId":"INV-0003","createdAt":"Sep 2, 2026"},{"id":"QUO-0003","date":"2026-09-03","orderId":"ORD-0001","orderName":"Yiwu Kitchenware Sourcing #104","customerId":"CUST-0001","customerName":"Alexander Vance","products":[{"id":1788433045736.5962,"name":"Ceramic Coffee Mug with Bamboo Lid","pic":"🏺","qty":100,"price":8.8,"amount":880.0000000000001,"includesShipping":true}],"prodCurrency":"RMB","prodRate":1,"prodTotal":880.0000000000001,"services":[],"servCurrency":"RMB","servRate":1,"servTotal":0,"shipping":{"method":"By Sea","fromLocation":"Yiwu","toLocation":"Karachi Warehouse","transitDays":"","tracking":"","amount":0},"shippingCurrency":"RMB","shippingRate":1,"shippingTotal":0,"packing":[],"totalBoxes":0,"totalWeight":0,"totalCbm":0,"grandTotal":880.0000000000001,"customerCurrency":"RMB","customerRate":1,"customerTotal":880.0000000000001,"status":"Approved","invoiceId":"INV-0002","createdAt":"Sep 3, 2026"},{"id":"QUO-0004","date":"2026-09-08","orderId":"ORD-0003","orderName":"lint remover","customerId":"CUST-0005","customerName":"Zubair","products":[{"id":1788864587624.3193,"name":"Lint Remover","pic":"🏺","qty":1000,"price":10.5,"amount":10500,"includesShipping":true}],"prodCurrency":"RMB","prodRate":1,"prodTotal":10500,"services":[],"servCurrency":"RMB","servRate":1,"servTotal":0,"shipping":{"method":"By Sea","fromLocation":"Yiwu","toLocation":"Karachi Warehouse","transitDays":"","tracking":"","amount":0},"shippingCurrency":"RMB","shippingRate":1,"shippingTotal":0,"packing":[{"id":1788864630452.137,"w":48.5,"l":38.5,"d":66.5,"unit":"cm","weight":18,"boxes":10,"totalWeight":180,"totalCbm":1.24172125}],"totalBoxes":10,"totalWeight":180,"totalCbm":1.24172125,"grandTotal":10500,"customerCurrency":"PKR","customerRate":43,"customerTotal":451500,"status":"Approved","invoiceId":"INV-0004","createdAt":"Sep 8, 2026"}],"invoices":[{"id":"INV-0002","quoteId":"QUO-0003","date":"2026-09-03","orderId":"ORD-0001","orderName":"Yiwu Kitchenware Sourcing #104","customerId":"CUST-0001","customerName":"Alexander Vance","products":[{"id":1788433045736.5962,"name":"Ceramic Coffee Mug with Bamboo Lid","pic":"🏺","qty":100,"price":8.8,"amount":880.0000000000001,"includesShipping":true}],"prodCurrency":"RMB","prodRate":1,"prodTotal":880.0000000000001,"services":[],"servCurrency":"RMB","servRate":1,"servTotal":0,"shipping":{"method":"By Sea","fromLocation":"Yiwu","toLocation":"Karachi Warehouse","transitDays":"","tracking":"","amount":0},"shippingCurrency":"RMB","shippingRate":1,"shippingTotal":0,"packing":[],"totalBoxes":0,"totalWeight":0,"totalCbm":0,"grandTotal":880.0000000000001,"customerCurrency":"RMB","customerRate":1,"customerTotal":880.0000000000001,"createdAt":"Sep 3, 2026"},{"id":"INV-0003","quoteId":"QUO-0001","date":"2026-09-02","orderId":"ORD-0001","orderName":"Yiwu Kitchenware Sourcing #104","customerId":"CUST-0001","customerName":"Alexander Vance","products":[{"id":1,"name":"Double-wall Vacuum Tumbler 500ml","pic":"☕","qty":2500,"price":14.5,"amount":36250,"includesShipping":true},{"id":2,"name":"Silicone Straw Cleaning Set","pic":"📦","qty":2500,"price":2.2,"amount":5500,"includesShipping":false}],"prodCurrency":"RMB","prodRate":1,"prodTotal":41750,"services":[{"id":1,"name":"Pre-Shipment Inspection (QC)","type":"fixed","value":1800,"amount":1800},{"id":2,"name":"Sourcing Commission Fee","type":"percent","value":5,"amount":2087.5}],"servCurrency":"RMB","servRate":1,"servTotal":3887.5,"shipping":null,"shippingCurrency":"RMB","shippingRate":1,"shippingTotal":0,"packing":[{"id":1,"w":45,"l":55,"d":35,"unit":"cm","weight":14.5,"boxes":50,"totalWeight":725,"totalCbm":4.3313}],"totalBoxes":50,"totalWeight":725,"totalCbm":4.3313,"grandTotal":45637.5,"customerCurrency":"RMB","customerRate":1,"customerTotal":0,"createdAt":"Sep 3, 2026"},{"id":"INV-0004","quoteId":"QUO-0004","date":"2026-09-08","orderId":"ORD-0003","orderName":"lint remover","customerId":"CUST-0005","customerName":"Zubair","products":[{"id":1788864587624.3193,"name":"Lint Remover","pic":"🏺","qty":1000,"price":10.5,"amount":10500,"includesShipping":true}],"prodCurrency":"RMB","prodRate":1,"prodTotal":10500,"services":[],"servCurrency":"RMB","servRate":1,"servTotal":0,"shipping":{"method":"By Sea","fromLocation":"Yiwu","toLocation":"Karachi Warehouse","transitDays":"","tracking":"","amount":0},"shippingCurrency":"RMB","shippingRate":1,"shippingTotal":0,"packing":[{"id":1788864630452.137,"w":48.5,"l":38.5,"d":66.5,"unit":"cm","weight":18,"boxes":10,"totalWeight":180,"totalCbm":1.24172125}],"totalBoxes":10,"totalWeight":180,"totalCbm":1.24172125,"grandTotal":10500,"customerCurrency":"PKR","customerRate":43,"customerTotal":451500,"createdAt":"Sep 8, 2026"}],"products":[{"id":"PROD-0001","name":"Double-wall Vacuum Tumbler 500ml","defaultPrice":0,"details":"SUS304 Stainless Steel, powder coated, leakproof lid","image":null,"createdAt":"Sep 3, 2026"},{"id":"PROD-0002","name":"Silicone Straw Cleaning Set","defaultPrice":0,"details":"Food-grade silicone with nylon brush, polybag packed","image":null,"createdAt":"Sep 3, 2026"},{"id":"PROD-0003","name":"Ceramic Coffee Mug with Bamboo Lid","defaultPrice":0,"details":"Nordic matte glaze, gift box packaging","image":null,"createdAt":"Sep 3, 2026"},{"id":"PROD-0004","name":"USB-C Fast Charging Cable 2M","defaultPrice":0,"details":"Braided nylon, 60W Power Delivery","image":null,"createdAt":"Sep 3, 2026"},{"id":"PROD-0006","name":"Feed Mill mOtor","defaultPrice":0,"details":"—","image":null,"createdAt":"Sep 3, 2026"},{"id":"PROD-0009","name":"Lint Remover","defaultPrice":0,"details":"—","image":null,"createdAt":"Sep 8, 2026"}],"services":[{"id":"SERV-0001","name":"Pre-Shipment Inspection (QC)","defaultValue":0,"details":"Factory on-site AQL standard quality inspection & photo report","createdAt":"Sep 3, 2026"},{"id":"SERV-0002","name":"Sourcing Commission Fee","defaultValue":0,"details":"Full China sourcing, sample validation & factory negotiation fee","createdAt":"Sep 3, 2026"},{"id":"SERV-0003","name":"Custom Packaging & Barcoding","defaultValue":0,"details":"Custom color gift box, FNSKU labeling & palletizing","createdAt":"Sep 3, 2026"},{"id":"SERV-0004","name":"Warehouse Consolidation Storage","defaultValue":0,"details":"Free 30-day container loading dock consolidation in Yiwu","createdAt":"Sep 3, 2026"}],"shippingLocations":[{"id":1,"name":"Yiwu","type":"from","createdAt":"Sep 3, 2026"},{"id":2,"name":"Guangzhou","type":"from","createdAt":"Sep 3, 2026"},{"id":3,"name":"Karachi Warehouse","type":"to","createdAt":"Sep 3, 2026"},{"id":4,"name":"Lahore Warehouse","type":"to","createdAt":"Sep 3, 2026"},{"id":5,"name":"Faisalabad Warehouse","type":"to","createdAt":"Sep 3, 2026"}],"banks":[{"id":"BANK-0001","name":"Bank of China (Yiwu Chouzhou Sub-Branch)","accountName":"China Sourcing Ltd","accountNumber":"6217 8520 1948 3012","currency":"RMB","currentBalance":0,"openingBalance":50000,"createdAt":"Sep 3, 2026"},{"id":"BANK-0002","name":"Meezan Bank Ltd (Karachi Corporate)","accountName":"CS Global Logistics PK","accountNumber":"0102 9948 2210 01","currency":"PKR","currentBalance":0,"openingBalance":1500000,"createdAt":"Sep 3, 2026"},{"id":"BANK-0003","name":"Standard Chartered Bank (Hong Kong)","accountName":"China Sourcing International","accountNumber":"448-2-093847-1","currency":"USD","currentBalance":0,"openingBalance":25000,"createdAt":"Sep 3, 2026"}],"receipts":[{"id":"REC-0001","orderId":"ORD-0001","orderName":"Yiwu Kitchenware Sourcing #104","customerName":"Ahmed Al-Mansoor","bankId":"BANK-0001","bankName":"Bank of China (Yiwu Chouzhou Sub-Branch)","bankAccount":"6217 8520 1948 3012","currency":"USD","rate":7.2,"amount":6250,"amountRmb":45000,"date":"2026-09-02","details":"Buyer 98% TT deposit received via Bank of China SWIFT MT103 #BOC99281","createdAt":"Sep 3, 2026"},{"id":"REC-0002","orderId":"ORD-0002","orderName":"Shenzhen Bluetooth ANC Headphones Batch A","customerName":"Fatima Zahra","bankId":"BANK-0002","bankName":"Meezan Bank Ltd (Karachi Corporate)","bankAccount":"0102 9948 2210 01","currency":"PKR","rate":39,"amount":4680000,"amountRmb":120000,"date":"2026-09-03","details":"Full container order settlement received in PKR corporate account","createdAt":"Sep 3, 2026"},{"id":"REC-0003","orderId":"ORD-0001","orderName":"Yiwu Kitchenware Sourcing #104","customerName":"Alexander Vance","bankId":"BANK-0002","bankName":"Meezan Bank Ltd (Karachi Corporate)","bankAccount":"0102 9948 2210 01","currency":"PKR","rate":43,"amount":100000,"amountRmb":2325.5813953488373,"date":"2026-09-03","details":"","createdAt":"Sep 3, 2026"},{"id":"REC-0004","orderId":"ORD-0003","orderName":"lint remover","customerName":"Zubair","bankId":"BANK-0002","bankName":"Meezan Bank Ltd (Karachi Corporate)","bankAccount":"0102 9948 2210 01","currency":"PKR","rate":43,"amount":100000,"amountRmb":2325.5813953488373,"date":"2026-09-08","details":"","createdAt":"Sep 8, 2026"},{"id":"REC-0005","orderId":"ORD-0003","orderName":"lint remover","customerName":"Zubair","bankId":"BANK-0002","bankName":"Meezan Bank Ltd (Karachi Corporate)","bankAccount":"0102 9948 2210 01","currency":"PKR","rate":43,"amount":200000,"amountRmb":4651.162790697675,"date":"2026-09-08","details":"","createdAt":"Sep 8, 2026"}],"expenses":[{"id":"EXP-0001","name":"Pre-Shipment Factory Inspection (QC)","defaultAmount":0,"details":"Factory on-site quality check, defect verification & photo audit report","createdAt":"Sep 3, 2026"},{"id":"EXP-0002","name":"China Customs Clearance & Export Docs","defaultAmount":0,"details":"Export declaration, bill of lading documentation & customs inspection fees","createdAt":"Sep 3, 2026"},{"id":"EXP-0003","name":"Inland Trucking & Loading Dock Labor","defaultAmount":0,"details":"Factory to Yiwu/Ningbo warehouse transport and container staging","createdAt":"Sep 3, 2026"},{"id":"EXP-0004","name":"Packaging, Palletizing & Barcode Labels","defaultAmount":0,"details":"Export pallet wrapping, strapping and carton FNSKU barcode application","createdAt":"Sep 3, 2026"},{"id":"EXP-0005","name":"Inspection","defaultAmount":0,"details":"","createdAt":"Sep 8, 2026"},{"id":"EXP-0006","name":"Yiwu Office Rent","defaultAmount":0,"details":"","createdAt":"Sep 9, 2026"}],"chargedExpenses":[{"id":"VOUCH-0001","expenseId":"EXP-0001","expenseName":"Pre-Shipment Factory Inspection (QC)","orderId":"ORD-0001","orderName":"Yiwu Kitchenware Sourcing #104","bankId":"BANK-0001","bankName":"Bank of China (Yiwu Chouzhou Sub-Branch)","amount":1800,"date":"2026-09-02","details":"QC Engineer factory visit fee to Yongkang cookware plant","createdAt":"Sep 3, 2026"},{"id":"VOUCH-0002","expenseId":"EXP-0002","expenseName":"China Customs Clearance & Export Docs","orderId":"ORD-0002","orderName":"Shenzhen Bluetooth ANC Headphones Batch A","bankId":"BANK-0003","bankName":"Standard Chartered Bank (Hong Kong)","amount":350,"date":"2026-09-03","details":"Shenzhen Yantian port export declaration & customs brokerage fee","createdAt":"Sep 3, 2026"},{"id":"VOUCH-0008","expenseId":"EXP-0005","expenseName":"Inspection","orderId":"ORD-0003","orderName":"lint remover","bankId":"BANK-0001","bankName":"Bank of China (Yiwu Chouzhou Sub-Branch)","amount":100,"date":"2026-09-08","details":"","createdAt":"Sep 8, 2026"}],"suppliers":[{"id":"SUP-0001","name":"Shenzhen Opto-Electronics Co., Ltd.","totalPayable":0,"totalPaid":0,"balanceDue":0,"createdAt":"Sep 3, 2026"},{"id":"SUP-0002","name":"Yiwu Green Horizon Commodity Factory","totalPayable":0,"totalPaid":0,"balanceDue":0,"createdAt":"Sep 3, 2026"},{"id":"SUP-0003","name":"Guangzhou Apex Hardware & Tools Ltd.","totalPayable":0,"totalPaid":0,"balanceDue":0,"createdAt":"Sep 3, 2026"},{"id":"VEND-0001","name":"Sinotrans Logistics Ningbo","totalPayable":0,"totalPaid":0,"balanceDue":0,"createdAt":"Sep 10, 2026"},{"id":"VEND-0002","name":"Yiwu Speed Freight Forwarding Ltd","totalPayable":0,"totalPaid":0,"balanceDue":0,"createdAt":"Sep 10, 2026"}],"purchases":[{"id":"PUR-0001","supplierId":"SUP-0001","supplierName":"Shenzhen Opto-Electronics Co., Ltd.","orderId":"ORD-0001","orderName":"Yiwu Kitchenware Sourcing #104","customerName":"Global Retail Direct (US)","productId":"PROD-0001","productName":"Smart LED Bulb 12W E27 Base","qty":2500,"unitCost":0,"amount":31250,"currency":"RMB","rate":1,"amountRmb":31250,"date":"2026-08-15","details":"Production batch #1. Factory PI #SOE-2026-088. 30% deposit paid, 70% upon B/L copy.","createdAt":"Sep 3, 2026"},{"id":"PUR-0002","supplierId":"SUP-0002","supplierName":"Yiwu Green Horizon Commodity Factory","orderId":"ORD-0002","orderName":"Shenzhen Bluetooth ANC Headphones Batch A","customerName":"Nordic Home Concepts (EU)","productId":"PROD-0002","productName":"Stainless Steel Insulated Tumbler 500ml","qty":1000,"unitCost":0,"amount":2800,"currency":"USD","rate":7.2,"amountRmb":20160,"date":"2026-08-20","details":"Laser logo engraving and custom white tuck box packing included.","createdAt":"Sep 3, 2026"}],"cashPurchases":[{"id":"CPUR-0001","supplierId":"SUP-0003","supplierName":"Guangzhou Apex Hardware & Tools Ltd.","orderId":"ORD-0001","orderName":"Yiwu Kitchenware Sourcing #104","customerName":"Global Retail Direct (US)","productId":"PROD-0001","productName":"Smart LED Bulb 12W E27 Base","qty":200,"unitCost":0,"amount":2360,"currency":"RMB","rate":1,"amountRmb":2360,"bankId":"BANK-0001","bankName":"Agricultural Bank of China (ABC)","bankAccount":"6228 4804 9283 1029","date":"2026-08-25","details":"Urgent spot replacement modules, market buy with cash receipt.","createdAt":"Sep 3, 2026"},{"id":"CPUR-0002","supplierId":"SUP-0002","supplierName":"Yiwu Green Horizon Commodity Factory","orderId":"ORD-0002","orderName":"Shenzhen Bluetooth ANC Headphones Batch A","customerName":"Nordic Home Concepts (EU)","productId":"PROD-0002","productName":"Stainless Steel Insulated Tumbler 500ml","qty":300,"unitCost":0,"amount":750,"currency":"USD","rate":7.2,"amountRmb":5400,"bankId":"BANK-0003","bankName":"Standard Chartered (HK)","bankAccount":"012-872-901823-1","date":"2026-08-28","details":"Direct Yiwu District 2 market buy, paid from Standard Chartered USD account.","createdAt":"Sep 3, 2026"}],"supplierPayments":[{"id":"PAY-0001","supplierId":"SUP-0001","supplierName":"Shenzhen Opto-Electronics Co., Ltd.","bankId":"BANK-0001","bankName":"Agricultural Bank of China (ABC)","bankAccount":"6228 4804 9283 1029","currency":"RMB","rate":1,"amount":10000,"amountRmb":10000,"date":"2026-08-18","details":"Advance 30% deposit for LED production run batch #1.","createdAt":"Sep 3, 2026"},{"id":"PAY-0002","supplierId":"SUP-0002","supplierName":"Yiwu Green Horizon Commodity Factory","bankId":"BANK-0003","bankName":"Standard Chartered (HK)","bankAccount":"012-872-901823-1","currency":"USD","rate":7.2,"amount":1500,"amountRmb":10800,"date":"2026-08-22","details":"Material procurement deposit via telegraphic transfer (T/T).","createdAt":"Sep 3, 2026"}],"media":[{"id":"MED-0001","date":"2026-08-16","orderId":"ORD-0001","orderName":"Yiwu Kitchenware Sourcing #104","customerName":"Global Retail Direct (US)","photosVideos":[],"files":[],"notes":"Pre-production golden samples approved. High resolution product shots and CE RoHS test reports from manufacturer.","createdAt":"Sep 3, 2026"},{"id":"MED-0002","date":"2026-08-21","orderId":"ORD-0002","orderName":"Shenzhen Bluetooth ANC Headphones Batch A","customerName":"Nordic Home Concepts (EU)","photosVideos":[],"files":[],"notes":"Laser engraving sample approved by EU buyer. Drop test and thermal retention videos recorded.","createdAt":"Sep 3, 2026"}],"transfers":[{"id":"TRF-0001","date":"2026-08-19","type":"bank_to_bank","fromBankId":"BANK-0001","fromBankName":"Agricultural Bank of China (ABC)","toBankId":"BANK-0002","toBankName":"Industrial and Commercial Bank of China (ICBC)","sourceAmount":0,"exchangeRate":1,"destAmount":0,"createdAt":"Sep 3, 2026"},{"id":"TRF-0002","date":"2026-08-25","type":"rmb_to_pkr","fromBankId":"BANK-0001","fromBankName":"Agricultural Bank of China (ABC)","toBankId":"BANK-0004","toBankName":"Habib Bank Limited (HBL Pakistan)","sourceAmount":0,"exchangeRate":39,"destAmount":0,"createdAt":"Sep 3, 2026"},{"id":"TRF-0003","date":"2026-08-25","type":"bank_to_bank","fromBankId":"BANK-0001","fromBankName":"","toBankId":"BANK-0002","toBankName":"","sourceAmount":0,"exchangeRate":1,"destAmount":0,"createdAt":"Sep 8, 2026"},{"id":"TRF-0004","date":"2026-08-25","type":"bank_to_bank","fromBankId":"BANK-0001","fromBankName":"Agricultural Bank of China (ABC)","toBankId":"BANK-0002","toBankName":"Industrial and Commercial Bank of China (ICBC)","sourceAmount":0,"exchangeRate":1,"destAmount":0,"createdAt":"Sep 8, 2026"},{"id":"TRF-0005","date":"2026-08-25","type":"bank_to_bank","fromBankId":"BANK-0001","fromBankName":"","toBankId":"BANK-0002","toBankName":"","sourceAmount":0,"exchangeRate":1,"destAmount":0,"createdAt":"Sep 8, 2026"},{"id":"TRF-0006","date":"2026-08-25","type":"bank_to_bank","fromBankId":"BANK-0001","fromBankName":"","toBankId":"BANK-0002","toBankName":"","sourceAmount":0,"exchangeRate":1,"destAmount":0,"createdAt":"Sep 8, 2026"},{"id":"TRF-0007","date":"2026-08-25","type":"bank_to_bank","fromBankId":"BANK-0001","fromBankName":"","toBankId":"BANK-0002","toBankName":"","sourceAmount":0,"exchangeRate":1,"destAmount":0,"createdAt":"Sep 8, 2026"},{"id":"TRF-0008","date":"2026-08-25","type":"bank_to_bank","fromBankId":"BANK-0001","fromBankName":"","toBankId":"BANK-0002","toBankName":"","sourceAmount":0,"exchangeRate":1,"destAmount":0,"createdAt":"Sep 8, 2026"}],"overheadExpenses":[{"id":"OVHD-0001","date":"2026-08-15","bankId":"BANK-0001","bankName":"Agricultural Bank of China (ABC)","amount":3500,"amountRmb":3500,"currency":"RMB","rate":1,"createdAt":"Sep 3, 2026"},{"id":"OVHD-0002","date":"2026-08-22","bankId":"BANK-0003","bankName":"Standard Chartered (HK)","amount":150,"amountRmb":1080,"currency":"USD","rate":7.2,"createdAt":"Sep 3, 2026"},{"id":"PUR-0001","date":"2026-08-26","bankId":"BANK-0001","bankName":"Bank of China (Yiwu Chouzhou Sub-Branch)","amount":500,"amountRmb":500,"currency":"RMB","rate":1,"createdAt":"Sep 8, 2026"},{"id":"OVHD-0003","date":"2026-08-26","bankId":"BANK-0001","bankName":"Bank of China (Yiwu Chouzhou Sub-Branch)","amount":500,"amountRmb":500,"currency":"RMB","rate":1,"createdAt":"Sep 8, 2026"},{"id":"OVHD-0004","date":"2026-08-26","bankId":"BANK-0001","bankName":"Bank of China (Yiwu Chouzhou Sub-Branch)","amount":500,"amountRmb":500,"currency":"RMB","rate":1,"createdAt":"Sep 8, 2026"},{"id":"OVHD-0005","date":"2026-08-26","bankId":"BANK-0001","bankName":"Bank of China (Yiwu Chouzhou Sub-Branch)","amount":500,"amountRmb":500,"currency":"RMB","rate":1,"createdAt":"Sep 8, 2026"},{"id":"OVHD-0006","date":"2026-08-26","bankId":"BANK-0001","bankName":"Bank of China (Yiwu Chouzhou Sub-Branch)","amount":500,"amountRmb":500,"currency":"RMB","rate":1,"createdAt":"Sep 8, 2026"},{"id":"OVHD-0007","date":"2026-09-09","bankId":"BANK-0001","bankName":"Bank of China (Yiwu Chouzhou Sub-Branch)","amount":500,"amountRmb":500,"currency":"RMB","rate":1,"createdAt":"Sep 9, 2026"},{"id":"OVHD-0008","date":"2026-09-09","bankId":"BANK-0001","bankName":"Bank of China (Yiwu Chouzhou Sub-Branch)","amount":300,"amountRmb":300,"currency":"RMB","rate":1,"createdAt":"Sep 9, 2026"}],"overheadCategories":[{"id":"OHC-0001","name":"Office Rent","createdAt":"Sep 9, 2026"},{"id":"OHC-0002","name":"Staff Salaries & Wages","createdAt":"Sep 9, 2026"},{"id":"OHC-0003","name":"Utilities & Electricity","createdAt":"Sep 9, 2026"},{"id":"OHC-0004","name":"Internet, Phone & Telecom","createdAt":"Sep 9, 2026"},{"id":"OHC-0005","name":"Office Supplies & Refreshments","createdAt":"Sep 9, 2026"},{"id":"OHC-0006","name":"Legal, Audit & Professional Fees","createdAt":"Sep 9, 2026"}],"partners":[{"id":"PART-0001","name":"Asim Khan","mobile":"+86 138 2910 8821","sharePercent":0,"totalWithdrawn":0,"createdAt":"Sep 3, 2026"},{"id":"PART-0002","name":"Tariq Mahmood","mobile":"+92 300 4892019","sharePercent":0,"totalWithdrawn":0,"createdAt":"Sep 3, 2026"},{"id":"PART-0003","name":"Tariq Mehmood","mobile":"+92 300 1234567","sharePercent":0,"totalWithdrawn":0,"createdAt":"Sep 8, 2026"},{"id":"PART-0004","name":"Test Partner","mobile":"123","sharePercent":0,"totalWithdrawn":0,"createdAt":"Sep 8, 2026"},{"id":"PART-0005","name":"Tariq Mehmood","mobile":"+92 300 1234567","sharePercent":0,"totalWithdrawn":0,"createdAt":"Sep 8, 2026"},{"id":"PART-0006","name":"Tariq Mehmood","mobile":"+92 300 1234567","sharePercent":0,"totalWithdrawn":0,"createdAt":"Sep 8, 2026"},{"id":"PART-0007","name":"Tariq Mehmood","mobile":"+92 300 1234567","sharePercent":0,"totalWithdrawn":0,"createdAt":"Sep 8, 2026"},{"id":"PART-0008","name":"Waheed","mobile":"","sharePercent":0,"totalWithdrawn":0,"createdAt":"Sep 9, 2026"}],"banamEntries":[{"id":"BAN-0001","date":"2026-08-20","partnerId":"PART-0001","partnerName":"Asim Khan","bankId":"BANK-0001","bankName":"Agricultural Bank of China (ABC)","amount":5000,"amountRmb":5000,"currency":"RMB","rate":1,"createdAt":"Sep 3, 2026"},{"id":"BAN-0002","date":"2026-08-27","partnerId":"PART-0003","partnerName":"Tariq Mehmood","bankId":"BANK-0001","bankName":"Bank of China (Yiwu Chouzhou Sub-Branch)","amount":800,"amountRmb":800,"currency":"RMB","rate":1,"createdAt":"Sep 8, 2026"},{"id":"BAN-0003","date":"2026-08-27","partnerId":"PART-0006","partnerName":"Tariq Mehmood","bankId":"BANK-0001","bankName":"Bank of China (Yiwu Chouzhou Sub-Branch)","amount":800,"amountRmb":800,"currency":"RMB","rate":1,"createdAt":"Sep 8, 2026"},{"id":"BAN-0004","date":"2026-08-27","partnerId":"PART-0007","partnerName":"Tariq Mehmood","bankId":"BANK-0001","bankName":"Bank of China (Yiwu Chouzhou Sub-Branch)","amount":800,"amountRmb":800,"currency":"RMB","rate":1,"createdAt":"Sep 8, 2026"}],"shipmentStages":[{"id":1,"stepNumber":1,"name":"Approved","badgeColor":"indigo","isFinal":false},{"id":2,"stepNumber":1,"name":"Payment","badgeColor":"indigo","isFinal":false},{"id":3,"stepNumber":1,"name":"Production","badgeColor":"indigo","isFinal":false},{"id":4,"stepNumber":1,"name":"Received in China Warehouse","badgeColor":"indigo","isFinal":false},{"id":5,"stepNumber":1,"name":"Quality Check","badgeColor":"indigo","isFinal":false},{"id":6,"stepNumber":1,"name":"Shipping","badgeColor":"indigo","isFinal":false},{"id":7,"stepNumber":1,"name":"Customs","badgeColor":"indigo","isFinal":false},{"id":8,"stepNumber":1,"name":"Delivered","badgeColor":"indigo","isFinal":false}],"shippingStatuses":[{"id":"SHIP-0002","orderId":"ORD-0002","stageName":"Quality Check","createdAt":"Sep 3, 2026"},{"id":"SHIP-0003","orderId":"ORD-0003","stageName":"Quality Check","createdAt":"Sep 8, 2026"},{"id":"SHIP-0007","orderId":"ORD-0004","stageName":"Customs Clearance","createdAt":"Sep 9, 2026"}],"masterTasks":[{"id":1,"title":"Golden Sample approval & specification sign-off","sortOrder":0,"isActive":false},{"id":2,"title":"Confirm Proforma Invoice (PI) & terms with factory","sortOrder":0,"isActive":false},{"id":3,"title":"Verify deposit transfer & schedule production kick-off","sortOrder":0,"isActive":false},{"id":4,"title":"Conduct mid-production raw materials inspection","sortOrder":0,"isActive":false},{"id":5,"title":"Final Pre-Shipment Inspection (PSI) per AQL 2.5","sortOrder":0,"isActive":false},{"id":6,"title":"Verify export packaging, barcode & carton labeling","sortOrder":0,"isActive":false},{"id":7,"title":"Book shipping space & issue Bill of Lading / AWB draft","sortOrder":0,"isActive":false},{"id":8,"title":"Confirm customs clearance & final destination handover","sortOrder":0,"isActive":false}],"orderTasks":[{"id":"TSK-0001","date":"2026-09-08","orderId":"ORD-0001","orderName":"Yiwu Kitchenware Sourcing #104","customerName":"Global Retail Direct (US)","tasks":[{"id":"t1","text":"Golden Sample approval & specification sign-off","date":"2026-09-03","completed":true,"order_index":1},{"id":"t2","text":"Confirm Proforma Invoice (PI) & terms with factory","date":"2026-09-05","completed":true,"order_index":2},{"id":"t3","text":"Verify deposit transfer & schedule production kick-off","date":"2026-09-07","completed":true,"order_index":3},{"id":"t4","text":"Conduct mid-production raw materials inspection","date":"2026-09-08","completed":false,"order_index":4},{"id":"t5","text":"Final Pre-Shipment Inspection (PSI) per AQL 2.5","date":"2026-09-09","completed":false,"order_index":5},{"id":"t6","text":"Verify export packaging, barcode & carton labeling","date":"2026-09-11","completed":false,"order_index":6},{"id":"t7","text":"Book shipping space & issue Bill of Lading / AWB draft","date":"2026-09-15","completed":false,"order_index":7},{"id":"t8","text":"Confirm customs clearance & final destination handover","date":"2026-09-22","completed":false,"order_index":8}],"createdAt":"Sep 8, 2026"},{"id":"TSK-0002","date":"2026-09-08","orderId":"ORD-0002","orderName":"Shenzhen Bluetooth ANC Headphones Batch A","customerName":"Nordic Home Concepts (EU)","tasks":[{"id":"t1","text":"Golden Sample approval & specification sign-off","date":"2026-09-04","completed":true,"order_index":1},{"id":"t2","text":"Confirm Proforma Invoice (PI) & terms with factory","date":"2026-09-06","completed":true,"order_index":2},{"id":"t3","text":"Verify deposit transfer & schedule production kick-off","date":"2026-09-08","completed":false,"order_index":3},{"id":"t4","text":"Conduct mid-production raw materials inspection","date":"2026-09-09","completed":false,"order_index":4},{"id":"t5","text":"Final Pre-Shipment Inspection (PSI) per AQL 2.5","date":"2026-09-12","completed":false,"order_index":5},{"id":"t6","text":"Verify export packaging, barcode & carton labeling","date":"2026-09-16","completed":false,"order_index":6}],"createdAt":"Sep 8, 2026"}],"counters":{"customer":7,"order":5,"quote":5,"product":10,"service":5,"invoice":5,"bank":4,"receipt":6,"expense":6,"voucher":9,"supplier":7,"purchase":4,"cash_purchase":4,"payment":4,"media":6,"transfer":10,"overhead_expense":9,"partner":9,"banam":5,"shipping_status":10,"order_task":7,"overhead_category":7,"shipping_bill":2,"shipping_payment":3}};

  function getStore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch(e) {
      console.warn('Could not read from localStorage, using memory store:', e);
    }
    const fresh = JSON.parse(JSON.stringify(INITIAL_SEED));
    saveStore(fresh);
    return fresh;
  }

  function saveStore(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch(e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // Helper mapping API endpoints to store collections
  const routeToKey = {
    'currencies': 'currencies',
    'customers': 'customers',
    'orders': 'orders',
    'quotes': 'quotes',
    'invoices': 'invoices',
    'products': 'products',
    'services': 'services',
    'shipping-locations': 'shippingLocations',
    'banks': 'banks',
    'receipts': 'receipts',
    'expenses': 'expenses',
    'charged-expenses': 'chargedExpenses',
    'suppliers': 'suppliers',
    'purchases': 'purchases',
    'cash-purchases': 'cashPurchases',
    'supplier-payments': 'supplierPayments',
    'media': 'media',
    'transfers': 'transfers',
    'overhead-expenses': 'overheadExpenses',
    'overhead-categories': 'overheadCategories',
    'partners': 'partners',
    'banam-entries': 'banamEntries',
    'shipment-stages': 'shipmentStages',
    'shipping-statuses': 'shippingStatuses',
    'master-tasks': 'masterTasks',
    'order-tasks': 'orderTasks'
  };

  const counterPrefixes = {
    customer: 'CUST', order: 'ORD', quote: 'QUO', invoice: 'INV',
    product: 'PROD', service: 'SERV', bank: 'BANK', receipt: 'REC',
    expense: 'EXP', voucher: 'VOUCH', supplier: 'SUP', purchase: 'PUR',
    cash_purchase: 'CPUR', payment: 'PAY', media: 'MED', transfer: 'TRF',
    overhead_expense: 'OVHD', partner: 'PART', banam: 'BAN',
    shipping_status: 'SHIP', order_task: 'TSK', overhead_category: 'OVCAT'
  };

  function getNextUniqueId(store, type) {
    if (!store.counters) store.counters = {};
    const prefix = counterPrefixes[type] || type.toUpperCase();
    let num = Number(store.counters[type] || 1);
    const key = Object.values(routeToKey).find(k => k.toLowerCase().includes(type.replace('_','').toLowerCase())) || 'orders';
    const list = store[key] || [];

    list.forEach(item => {
      if (item && item.id) {
        const m = String(item.id).match(/\d+$/);
        if (m) {
          const val = parseInt(m[0], 10);
          if (val >= num) num = val + 1;
        }
      }
    });

    store.counters[type] = num + 1;
    saveStore(store);
    return { nextId: prefix + '-' + String(num).padStart(4, '0'), serial: num };
  }

  function handleMockRequest(urlStr, method, body) {
    const store = getStore();
    const url = new URL(urlStr, window.location.href);
    const pathname = url.pathname.replace(/^.*?\/api/, '/api');
    const parts = pathname.split('/').filter(Boolean); // ['api', 'customers', ...]
    const entity = parts[1];
    const id = parts[2] ? decodeURIComponent(parts[2]) : null;
    const subAction = parts[3] ? decodeURIComponent(parts[3]) : null;

    // 1. Health check
    if (entity === 'health') {
      return { status: 200, data: { status: 'ok', mode: 'standalone-client', timestamp: new Date().toISOString() } };
    }

    // 2. Next ID
    if (entity === 'next-id') {
      const type = parts[2];
      return { status: 200, data: getNextUniqueId(store, type) };
    }

    // 3. Stats
    if (entity === 'stats') {
      return {
        status: 200,
        data: {
          orders: (store.orders || []).length,
          quotes: (store.quotes || []).length,
          customers: (store.customers || []).length,
          invoices: (store.invoices || []).length
        }
      };
    }

    // 4. Special route: /api/shipping-statuses/by-order/:orderId
    if (entity === 'shipping-statuses' && id === 'by-order' && parts[3]) {
      const targetOrderId = decodeURIComponent(parts[3]);
      const list = (store.shippingStatuses || []).filter(s => s.orderId === targetOrderId);
      return { status: 200, data: list };
    }

    // 5. Special route: /api/media/by-order/:orderId
    if (entity === 'media' && id === 'by-order' && parts[3]) {
      const targetOrderId = decodeURIComponent(parts[3]);
      const list = (store.media || []).filter(m => m.orderId === targetOrderId);
      return { status: 200, data: list };
    }

    // 6. Special route: /api/quotes/:id/approve
    if (entity === 'quotes' && subAction === 'approve' && method === 'POST') {
      const quote = (store.quotes || []).find(q => q.id === id);
      if (!quote) return { status: 404, data: { error: 'Quote not found' } };
      
      const invIdRes = getNextUniqueId(store, 'invoice');
      const invoice = {
        ...JSON.parse(JSON.stringify(quote)),
        id: invIdRes.nextId,
        quoteId: quote.id,
        createdAt: new Date().toISOString()
      };
      quote.status = 'Approved';
      quote.invoiceId = invoice.id;
      if (!store.invoices) store.invoices = [];
      store.invoices.unshift(invoice);
      saveStore(store);
      return { status: 200, data: { success: true, invoice, quote } };
    }

    // 7. Special route: /api/master-tasks-reorder
    if (entity === 'master-tasks-reorder' && method === 'POST') {
      const items = Array.isArray(body) ? body : (body.tasks || []);
      store.masterTasks = items;
      saveStore(store);
      return { status: 200, data: { success: true, count: items.length } };
    }

    // 8. Special route: /api/order-tasks/:id/toggle-task
    if (entity === 'order-tasks' && subAction === 'toggle-task' && method === 'POST') {
      const taskIndex = body.taskIndex;
      const completed = body.completed;
      const orderTask = (store.orderTasks || []).find(t => t.id === id);
      if (orderTask && orderTask.tasks && orderTask.tasks[taskIndex]) {
        orderTask.tasks[taskIndex].completed = completed;
        saveStore(store);
      }
      return { status: 200, data: { success: true, orderTask } };
    }

    // 9. Standard Collection Operations
    const storeKey = routeToKey[entity];
    if (storeKey && store[storeKey]) {
      const list = store[storeKey];

      // GET Collection
      if (method === 'GET' && !id) {
        return { status: 200, data: list };
      }

      // GET Single Item
      if (method === 'GET' && id) {
        const item = list.find(x => x.id === id || x.code === id);
        return item ? { status: 200, data: item } : { status: 404, data: { error: 'Not found' } };
      }

      // POST Create Item
      if (method === 'POST') {
        const item = { ...body };
        if (!item.id && !item.code) {
          const type = entity.replace(/-/g, '_').slice(0, -1);
          item.id = getNextUniqueId(store, type).nextId;
        }
        item.createdAt = item.createdAt || new Date().toISOString();
        list.unshift(item);
        saveStore(store);
        return { status: 201, data: item };
      }

      // PUT Update Item
      if (method === 'PUT' && id) {
        const idx = list.findIndex(x => x.id === id || x.code === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...body, id: list[idx].id || id };
          saveStore(store);
          return { status: 200, data: list[idx] };
        }
        // If not found, insert
        const newItem = { ...body, id };
        list.unshift(newItem);
        saveStore(store);
        return { status: 200, data: newItem };
      }

      // DELETE Item
      if (method === 'DELETE' && id) {
        store[storeKey] = list.filter(x => x.id !== id && x.code !== id);
        saveStore(store);
        return { status: 200, data: { success: true, deletedId: id } };
      }
    }

    // Fallback 404
    return { status: 404, data: { error: 'Route not found: ' + pathname } };
  }

  // Intercept window.fetch for /api calls when in standalone mode or when server is unavailable
  const originalFetch = window.fetch;
  let isStandaloneMode = (
    window.location.protocol === 'file:' ||
    window.location.hostname.includes('github.io') ||
    window.location.hostname.includes('pages.dev') ||
    window.location.port === ''
  );

  // Probe server once on load if running on localhost / dev port
  if (!isStandaloneMode) {
    originalFetch('/api/health', { signal: AbortSignal.timeout ? AbortSignal.timeout(1000) : undefined })
      .then(res => {
        if (!res.ok) isStandaloneMode = true;
      })
      .catch(() => {
        isStandaloneMode = true;
        console.log('📡 SCS ERP: No local backend server detected. Activated client-side storage engine.');
      });
  }

  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    const isApi = url.startsWith('/api') || url.includes('/api/');

    if (isApi && (isStandaloneMode || !url.startsWith('http://localhost:3000'))) {
      try {
        let method = (init && init.method ? init.method : 'GET').toUpperCase();
        let body = {};
        if (init && init.body) {
          try { body = JSON.parse(init.body); } catch(e) { body = init.body; }
        }
        const res = handleMockRequest(url, method, body);
        return new Response(JSON.stringify(res.data), {
          status: res.status,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch(err) {
        console.error('Mock storage error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    return originalFetch.apply(this, arguments);
  };

  // Expose backup & restore utilities globally
  window.scsStorage = {
    exportData() {
      const data = getStore();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'scs_erp_backup_' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
    },
    importData(fileInput) {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          saveStore(parsed);
          alert('Data restored successfully! The page will now reload.');
          window.location.reload();
        } catch(err) {
          alert('Invalid backup file: ' + err.message);
        }
      };
      reader.readAsText(file);
    },
    resetData() {
      if (confirm('Reset all data to default demo accounts? All custom entries will be reset.')) {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      }
    }
  };

  console.log('✅ Standalone Storage Engine Initialized (Offline & GitHub Pages Ready)');
})();
