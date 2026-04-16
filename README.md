# cs3110
CS3110 Programming the Mobile Web 

Weekly Assignments

6: Database Persistence is complete. Please see app.js for sequelize and sqlite usage. 


7: Activity Notifications is complete. Please see socket setup in app.js and socket calls in html/fetcher.js. Alerts for modifications made by the current user were annoying and redundant, so I excluded them. Alerts present for changes made by other logged in users (when multiple users are logged in on multiple devices).

Link to site: https://cbackus.chickenkiller.com/Activity-Notifications.html

8: Updated code to reflect these two APIs from https://developer.mozilla.org/en-US/docs/Web/API:

    Notifications - https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
    Notifications have been upgraded to use the Notification API with a fallback to alert(). This means users must allow browser notifications to receive real-time updates. If browser notifications are blocked, the system will use alert() as a fallback. Testing this works best on Edge or Firefox by executing the get, post, put, or delete operations on a separate device and observing the notifications on a laptop/desktop computer.

    Web Storage - https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
    The Web Storage API is being used to persist user theme preferences (background color, font type, and font color) across sessions. When a user selects their preferred theme settings, these preferences are saved in the browser's local storage. Upon revisiting the page, the stored preferences are retrieved and applied.
