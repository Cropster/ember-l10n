import { Promise } from 'rsvp';

export function fetchJsonFile(fileName) {
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open('GET', fileName);
    request.addEventListener('load', function() {
      try {
        let { responseText } = this;
        let json = JSON.parse(responseText);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    });
    request.addEventListener('error', reject);
    request.send();
  });
}
