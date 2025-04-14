import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import axios from "axios";

type CSVFileImportProps = {
  url: string;
  title: string;
};

export default function CSVFileImport({ url, title }: CSVFileImportProps) {
  const [file, setFile] = React.useState<File>();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
    }
  };

  const removeFile = () => {
    setFile(undefined);
  };

  const uploadFile = async () => {
    if (!file) {
      console.error("No file selected!");
      return;
    }

    try {
      // Get the presigned URL from the backend Lambda
      const response = await axios({
        method: "GET",
        url,
        params: {
          name: encodeURIComponent(file.name), // File name is passed to the API to generate a signed URL
        },
        headers: {
          Authorization: `Basic ${localStorage.getItem("authorization_token")}`,
        },
      });

      console.log('Response from lambda' + JSON.stringify(response));
      if (response.status === 401) {
        alert('Unauthorized: Please provide valid credentials.');
      } else if (response.status === 403) {
        alert('Forbidden: Access denied.');
      }
  
      // Check if we got the URL
      if (!response.data || !response.data.signedUrl) {
        throw new Error("Failed to get signed URL from server");
      }
  
      const signedUrl = response.data.signedUrl;
      console.log("File to upload: ", file.name);
      console.log("Uploading to: ", signedUrl);
  
      // Upload the file to the presigned URL
      const result = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "text/csv", 
        },
      });
  
      if (!result.ok) {
        throw new Error(`Failed to upload file: ${result.statusText}`);
      }
  
      console.log("File uploaded successfully:", result);
  
      // Reset the file input
      setFile(undefined);
    } catch (error: any) {
      // Axios wraps errors, so use error.response to access the API error
      console.log(JSON.stringify(error))
      if (error.response) {
        if (error.response.status === 403) {
          alert("Access denied! You do not have permission to access this resource.");
        } else {
          alert(`Unauthorized`);
        }
      } else {
         alert("Network or server error occurred.");
      }
      console.error("Error uploading file:", error);
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {!file ? (
        <input type="file" onChange={onFileChange} />
      ) : (
        <div>
          <button onClick={removeFile}>Remove file</button>
          <button onClick={uploadFile}>Upload file</button>
        </div>
      )}
    </Box>
  );
}
