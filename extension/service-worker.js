async function configureSidePanel() {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
}

chrome.runtime.onInstalled.addListener(configureSidePanel);
configureSidePanel();

// The action click is what grants activeTab access for the page. Open the
// side panel from that same user gesture so tabCapture can target the tab.
chrome.action.onClicked.addListener(async tab => {
  if (tab.id) await chrome.sidePanel.open({ tabId: tab.id });
});
