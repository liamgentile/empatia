export function isSelectedSocialMediaSite() {
  // Retrieve selected sites from chrome.storage
  return new Promise((resolve) => {
    chrome.storage.local.get(["selectedSites"], function (result) {
      const selectedSites = result.selectedSites || [];
      const currentUrl = window.location.href.toLowerCase();

      // Check if the current URL matches any of the selected social media sites
      const isSelected = selectedSites.some((site) =>
        currentUrl.includes(site)
      );
      resolve(isSelected);
    });
  });
}
