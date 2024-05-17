/**
 * @package    look-education
 * @copyright  Copyright Nehloo Interactive LLC
 * @license    https://github.com/look-education/look-education/blob/master/LICENSE
 */

import urlParser from 'js-video-url-parser';

import axios from 'axios';

import DatabaseRequest from "../frameworks/DatabaseRequest"

const VideoUtils = {

  /*
  |--------------------------------------------------------------------------
  | GetAsset
  |--------------------------------------------------------------------------
  |
  | Returns an asset object, based on a video URL
  |
  */
  GetAsset: async (url) => {
    const asset = urlParser.parse(url) || {};

    if (!Object.keys(asset).length) {
      if (url.includes("facebook.com")) {
        var regex = /(\d+)\/?$/;
        var match = regex.exec(url);
        asset.id = match[1];
        asset.mediaType = "video";
        asset.provider = "facebook";
      }
      else if (url.includes(".m3u8")) {
        asset.mediaType = "video";
        asset.provider = "custom";
      }
    }

    // urlParser doesn't return full source URL
    // but we'll add it to the asset here
    asset.sourceUrl = url;

    // TODO: convert this into a cloud function
    if (asset.provider !== "custom") {
      let assetData = await axios.get('https://noembed.com/embed?url=' + url);
      if (assetData.data) {
        assetData = assetData.data;
        asset.authorName = assetData.author_name;
        asset.authorUrl = assetData.author_url;
        asset.duration = assetData.duration;
        asset.title = (assetData.title !== asset.sourceUrl) ? assetData.title : "Video";
        asset.uploadedAt = assetData.upload_date;
      }
    }

    asset.thumbnail = await VideoUtils.GetThumbnail(asset);
    if (asset.thumbnail) {
      asset.thumbnail = asset.thumbnail.replace('https:', '').replace('http:', '')
    };

    return asset;
  },

  /*
  |--------------------------------------------------------------------------
  | GetThumbnail
  |--------------------------------------------------------------------------
  |
  | Returns the thumbnail of an asset
  |
  */
  GetThumbnail: async (asset) => {
    const thumbnailFormat = {
      youtube: 'shortImage'
    }
    var thumbnail = urlParser.create({
      videoInfo: {
        provider: asset['provider'],
        id: asset['id'],
        mediaType: asset['type']
      },
      format: thumbnailFormat[asset['provider']]
    });
    if (asset['provider'] === 'vimeo') {
      let res = await axios.get('http://vimeo.com/api/v2/video/' + asset['id'] + '.json');
      return res.data[0].thumbnail_large;
    }
    else if (asset['provider'] === 'dailymotion') {
      thumbnail = 'https://www.dailymotion.com/thumbnail/video/' + asset['id'];
      return thumbnail;
    }
    else if (asset['provider'] === 'facebook') {
      thumbnail = 'https://graph.facebook.com/' + asset['id'] + '/picture';
      return thumbnail;
    }
    return thumbnail;
  },

  /*
  |--------------------------------------------------------------------------
  | GetAssetUrl
  |--------------------------------------------------------------------------
  |
  | Returns an asset's URL, given a provider and the ID
  |
  */
  GetAssetUrl: (provider, id) => {
    var videoUrl;
    if (provider === 'youtube') {
      videoUrl = "https://youtube.com/watch?v=" + id;
    }
    else if (provider === 'dailymotion') {
      videoUrl = "https://www.dailymotion.com/video/" + id;
    }
    else if (provider === 'vimeo') {
      videoUrl = "https://vimeo.com/" + id;
    }
    return videoUrl;
  },

  /*
  |--------------------------------------------------------------------------
  | GetVideoUrlFromContent
  |--------------------------------------------------------------------------
  |
  | Returns the content's sourceUrl
  |
  */
  GetVideoUrlFromContent: (content) => {
    var videoUrl;
    if (content)
    if (DatabaseRequest.GetValue(content, "sourceUrl")) {
      videoUrl = DatabaseRequest.GetValue(content, "sourceUrl");
    }
    return videoUrl;
  }

}

export default VideoUtils