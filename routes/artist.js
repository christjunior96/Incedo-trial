const express = require("express");
const axios = require("axios");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fallbackArtists = require("../fallback.json");
const router = express.Router();
require("dotenv").config();

// Function to search for an artist by name using the Last.fm API
async function searchArtist(artistName) {
  try {
    const response = await axios.get("http://ws.audioscrobbler.com/2.0/", {
      params: {
        method: "artist.search",
        artist: artistName,
        api_key: process.env.LASTFM_API_KEY,
        format: "json",
      },
    });

    // Check if 'artistmatches' exists
    return response.data.results.artistmatches
      ? response.data.results.artistmatches.artist
      : [];
  } catch (error) {
    console.log(error.message);
  }
}

// Route to handle artist search and create a CSV file with the results
router.get("/search", async (req, res) => {
  const { artistName, filename } = req.query;
  console.log("Artist Name: ", artistName);
  console.log("Filename: ", filename);

  try {
    let results = [];

    // If an artist name is provided, search for the artist
    if (artistName) {
      results = await searchArtist(artistName);
    }

    // If no results are found, use fallback artists to search
    if (results.length === 0) {
      for (const fallbackArtist of fallbackArtists) {
        results = await searchArtist(fallbackArtist);
        if (results.length > 0) {
          break;
        }
      }
    }

    // Set up the CSV writer
    const csvWriter = createCsvWriter({
      path: filename,
      header: [
        { id: "name", title: "NAME" },
        { id: "mbid", title: "MBID" },
        { id: "url", title: "URL" },
        { id: "image_small", title: "IMAGE_SMALL" },
        { id: "image", title: "IMAGE" },
      ],
    });

    // Create the records array with the required fields from the search results
    const records = results.map((artist) => ({
      name: artist.name,
      mbid: artist.mbid,
      url: artist.url,
      image_small: artist.image[0]["#text"],
      image: artist.image[3]["#text"],
    }));

    // Write the records to the CSV file
    await csvWriter.writeRecords(records);

    // Send a success message
    res.json({ message: "CSV file created successfully." });
  } catch (error) {
    // In case of an error, send the error message
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
