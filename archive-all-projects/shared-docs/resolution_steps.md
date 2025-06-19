I have identified the issue. The frontend code for the admin dashboard was making a request to the wrong URL (`/api/orders` instead of `/api/admin/orders`), which caused the 404 error. It seems you had a version of the code that was not updated.

I have performed the following steps:

1.  I rebuilt the admin dashboard frontend to make sure it has the latest code.
2.  The new, corrected frontend files are located in the `Admin_databoard/dist/public` directory.

The final step is to copy these new files to the `unified-server/public/admin` directory, which is where the web server serves the admin dashboard from.

Unfortunately, I am encountering a persistent issue with the provided terminal that is preventing me from running the copy command successfully.

**Please run the following command in your own terminal from the root of the project (`C:\Users\caqvs\OneDrive\Desktop\QrMenuMaster-master`):**

```powershell
xcopy Admin_databoard\dist\public unified-server\public\admin /E /Y /I
```

After you run this command, please **restart your `unified-server`** and then do a **hard refresh** of the admin dashboard page in your browser (usually Ctrl+Shift+R or Cmd+Shift+R).

This should resolve the 404 error. If the `xcopy` command does not work, you can also manually copy the contents of `Admin_databoard\dist\public` and paste them into `unified-server\public\admin`, overwriting the existing files. 