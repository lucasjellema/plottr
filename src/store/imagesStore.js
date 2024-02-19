import { defineStore } from 'pinia';

import exifr from 'exifr';



import { v4 as uuidv4 } from 'uuid';


export const useImagesStore = defineStore('imageData', () => {


    const PLOTTR_IMAGES_DATABASE = 'plottr-ImagesDatabase'
    const openDatabase = () => {
        return new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                reject('IndexedDB support is required.');
            }

            const request = indexedDB.open(PLOTTR_IMAGES_DATABASE, 1);

            request.onerror = (event) => {
                reject('Database error: ' + event.target.errorCode);
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
            };
        });
    }

    const getUrlForIndexedDBImage = (imageId) => {
        return new Promise((resolve, reject) => {
            if (!imageId) return

            openDatabase().then((db) => {
                const transaction = db.transaction(['images'], 'readonly');
                const store = transaction.objectStore('images');
                const request = store.get(imageId);

                request.onsuccess = (event) => {
                    const imageFile = event.target.result.image;
                    const url = URL.createObjectURL(imageFile);
                    resolve(url)
                };

                request.onerror = (event) => {
                    reject('Error fetching image:' + event.target.error);
                };
            }).catch((error) => {
                reject('Error opening database:' + error);
            });
        })
    }


    const saveImage = async (file) => {
        return new Promise((resolve, reject) => {
            openDatabase().then((db) => {
                const transaction = db.transaction(['images'], 'readwrite');
                const store = transaction.objectStore('images');
                const request = store.add({ image: file });
                request.onsuccess = (event) => {
                    console.log('Image stored in IndexedDB', request.result);
                    // Optionally, display the image or indicate success to the user
                    const imageId = event.target.result; // This is the ID of the stored image
                    resolve(imageId)
                };
                request.onerror = (event) => {
                    reject('Error storing image:' + event.target.error);
                };
            }).catch((error) => {
                reject('Error opening database:' + error);
            });
        })
    }
    
    const resizeImage = (file, maxWidth, maxHeight, callback) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            // this element is created only in memory and ceases to exist when the function completes; it does not need to be removed explicitly
            const img = document.createElement("img");
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
    
                // Calculate the new image dimensions
                let width = img.width;
                let height = img.height;
    
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                canvas.width = width;
                canvas.height = height;
    
                // Draw the resized image
                ctx.drawImage(img, 0, 0, width, height);
    
                // Convert canvas to Blob
                canvas.toBlob((blob) => {
                    callback(blob);
                }, 'image/jpeg', 0.85); // Adjust the quality as needed
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    const extractEXIFData = async (imageFile) => {
        try {
          const output = await exifr.parse(imageFile, { gps: true });
          console.log(output); // Logs all extracted metadata
      
          const dateTimeOriginal = output.DateTimeOriginal;
          const gpsInfo =  {
            latitude: output.GPSLatitude,
            longitude: output.GPSLongitude,
            altitude: output.GPSAltitude,


          } ;
      
          return { dateTimeOriginal, gpsInfo };
        } catch (error) {
          console.error('Error extracting EXIF data:', error);
        }
      }

      

    return {
        getUrlForIndexedDBImage, resizeImage, saveImage, extractEXIFData
    };
});


