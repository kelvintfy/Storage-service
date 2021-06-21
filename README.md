# Snapfile - COM3014 CW2

## Download/Upload/Delete

## How to build

1. Clone this project
2. Install according to the dependencies inside package.json
3. Open terminal under the folder, type "npm start" to start the server
4. Browse http://localhost:4000/

## Todo List

- Integrating with URL-service

## Changes from last push

- Updated README.md

## Current MongoDB Schema

See model.js

## Routes that work

### GET method:

| Get             | Result                | Note                     |
| --------------- | --------------------- | ------------------------ |
| /returnurl/:id  | return a hash         | For EJS testing frontend |
| /download/:hash | Download file from S3 | N/A                      |

### POST method: Upload + Delete

| Post           | Result                                                 | Note                                                                                                                        |
| -------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| /dud/returnurl | Return a hash for downloading link back to URL-service | Please refer to Format-1                                                                                                    |
| /dud/upload    | Upload file to S3 and leave record in MongoDB          | After uploading, POST requests will be sent automatically to other backend services using the format-2                      |
| /dud/delete    | Delete file inside S3 & MongoDB (Hard delete)          | Receiving JSON of format-3 to trigger delete. POST method is used instead of DELETE method for the ease of using Kubernetes |

#### Format-1 of JSON:

Receiving:

```
{ type: 'RequestHash',
  data:
   {
     fileId: '607ccfafagagag12'
   }
}
```

Sending out:

```
{ type: 'HashSent',
  data:
   {
     hash: '607ccf61c850253e54923112', //randomHash in MongoDB
   }
}
```

#### Format-2 of JSON file:

Sending out:

```
{ type: 'FileUploaded',
  data:
   { fileId: '607ccf61c850253e54923112', //_id in MongoDB
     userId: 'd41d8cd98f00b204e9800998ecf8427e', //random generated example userId
     fileName: 'cat2.jpg', //user-defined original file name
     uploadedDate: 'Mon Apr 19 2021 01:31:29 GMT+0100 (British Summer Time)' //generated from Date(Date.now())
   }
}
```

#### Format-3 of JSON file:

Receiving:

```
{ type: 'FileDeleted',
  data:
   {
     fileId: '607ccf61c850253e54923112', //_id in MongoDB
   }
}
```

#### Frontend:

- Port 4000: Download/upload service
- Port 4001: User service
- Port 4002: Meta service

| Gate              | Method | Note                                                                                |
| ----------------- | ------ | ----------------------------------------------------------------------------------- |
| 4000/upload       | POST   | Upload file to S3, Port4000 DB, Port4001 DB and Port4002 DB                         |
| 4001/user/:fileId | DELETE | Delete file in Port4000 DB, Port4001 DB and S3 (fileId = fileId inside Port4001 DB) |
| 4001/user/:userId | GET    | Get files for specific user in Port4001 DB                                          |

File download link: http://localhost:4002/meta/get/:id (where id = id inside Port4002 DB)
