{
    "Licenses/*/*/*": {
      "60 Day Notice": {
        "notificationTemplate": "LIC_ABOUT_TO_EXPIRE",
        "notificationReport": false,
        "notifyContactTypes": "License Holder,Applicant",
        "mailerSetType": "Renewal",
        "mailerSetStatus": "Open",
        "mailerSetPrefix": "LIC_ABOUT_TO_EXPIRE",
        "updateExpirationStatus": "About to Expire",
        "updateRecordStatus": false,
        "updateWorkflowTask": false,
        "updateWorkflowStatus": false,
        "nextNotificationDays": 30,
        "nextNotification": "30 Day Notice"
      },
      "30 Day Notice": {
        "notificationTemplate": "LIC_EXPIRATION_30_DAY_NOTICE",
        "notificationReport": "License Expiration 30 Day Notice",
        "notifyContactTypes": "License Holder, Applicant",
        "mailerSetType": "Renewal",
        "mailerSetStatus": "Open",
        "mailerSetPrefix": "LIC_EXPIRATION_30_DAY_NOTICE",
        "updateExpirationStatus": false,
        "updateRecordStatus": false,
        "updateWorkflowTask": false,
        "updateWorkflowStatus": false,
        "nextNotificationDays": 0,
        "nextNotification": "Expiration Notice"
      },
      "Lein Notice": {
        "notificationTemplate": "LIC_EXPIRATION_FINAL_NOTICE",
        "notificationReport": "License Expiration Final Notice",
        "notifyContactTypes": "License Holder, Applicant",
        "mailerSetType": "Renewal",
        "mailerSetStatus": "Open",
        "mailerSetPrefix": "LIC_EXPIRATION_FINAL_NOTICE",
        "updateExpirationStatus": "Expired",
        "updateRecordStatus": "Expired",
        "updateWorkflowTask": "Collections",
        "updateWorkflowStatus": "Ready to File Lien",
        "nextNotificationDays": "",
        "nextNotification": ""
      }
    }
  }