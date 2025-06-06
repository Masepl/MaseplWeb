import sys
import os
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QLineEdit, QToolBar, QAction,
    QListWidget, QDockWidget, QFileDialog, QMessageBox, QInputDialog,
    QTabWidget, QVBoxLayout
)
from PyQt5.QtWebEngineWidgets import QWebEngineView, QWebEngineDownloadItem
from PyQt5.QtCore import QUrl, Qt
from PyQt5.QtGui import QIcon, QPalette, QColor

START_PAGE_FILE = "startpage.txt"

class SimpleBrowser(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Epik Browser by Masepl")
        self.setGeometry(100, 100, 1200, 800)

        # Tabs
        self.tabs = QTabWidget()
        self.tabs.setTabsClosable(True)
        self.tabs.setMovable(True)
        self.tabs.tabCloseRequested.connect(self.close_tab)
        self.tabs.currentChanged.connect(self.update_url_bar_and_title)
        self.setCentralWidget(self.tabs)

        # Historia
        self.history_list = QListWidget()
        self.history_dock = QDockWidget("Historia", self)
        self.history_dock.setWidget(self.history_list)
        self.addDockWidget(Qt.RightDockWidgetArea, self.history_dock)

        # Pasek narzędzi
        navtb = QToolBar("Nawigacja")
        navtb.setIconSize(Qt.QSize(16, 16))
        self.addToolBar(navtb)

        back_btn = QAction("◀", self)
        back_btn.triggered.connect(lambda: self.current_browser().back())
        navtb.addAction(back_btn)

        forward_btn = QAction("▶", self)
        forward_btn.triggered.connect(lambda: self.current_browser().forward())
        navtb.addAction(forward_btn)

        reload_btn = QAction("⟳", self)
        reload_btn.triggered.connect(lambda: self.current_browser().reload())
        navtb.addAction(reload_btn)

        home_btn = QAction("🏠", self)
        home_btn.triggered.connect(self.navigate_home)
        navtb.addAction(home_btn)

        self.url_bar = QLineEdit()
        self.url_bar.returnPressed.connect(self.navigate_to_url)
        self.url_bar.setPlaceholderText("Wpisz adres URL...")
        navtb.addWidget(self.url_bar)

        new_tab_btn = QAction("➕", self)
        new_tab_btn.triggered.connect(self.add_new_tab)
        navtb.addAction(new_tab_btn)

        history_btn = QAction("📜", self)
        history_btn.triggered.connect(self.toggle_history)
        navtb.addAction(history_btn)

        dark_mode_btn = QAction("🌙", self)
        dark_mode_btn.triggered.connect(self.enable_dark_mode)
        navtb.addAction(dark_mode_btn)

        set_start_btn = QAction("⚙️", self)
        set_start_btn.triggered.connect(self.set_start_page)
        navtb.addAction(set_start_btn)

        self.add_new_tab(QUrl(self.load_start_page()), "Start")

        # Styl kart i ogólny styl
        self.setStyleSheet("""
            QTabWidget::pane { border: 1px solid #444; border-radius: 6px; }
            QTabBar::tab { background: #333; color: white; padding: 6px; border-radius: 4px; }
            QTabBar::tab:selected { background: #555; }
            QToolBar { background: #2c2c2c; spacing: 6px; padding: 4px; }
            QLineEdit { background: #444; color: white; border-radius: 4px; padding: 4px; }
        """)

    def add_new_tab(self, qurl=None, label="Nowa karta"):
        if qurl is None:
            qurl = QUrl(self.load_start_page())

        browser = QWebEngineView()
        browser.setUrl(qurl)
        i = self.tabs.addTab(browser, label)
        self.tabs.setCurrentIndex(i)

        browser.urlChanged.connect(self.update_url_bar_and_title)
        browser.loadFinished.connect(lambda _: self.save_to_history(browser))
        browser.page().profile().downloadRequested.connect(self.handle_download)

    def current_browser(self):
        return self.tabs.currentWidget()

    def navigate_home(self):
        self.current_browser().setUrl(QUrl(self.load_start_page()))

    def navigate_to_url(self):
        url = self.url_bar.text()
        if not url.startswith("http"):
            url = "http://" + url
        self.current_browser().setUrl(QUrl(url))

    def update_url_bar_and_title(self, i=None):
        browser = self.current_browser()
        if browser:
            url = browser.url().toString()
            self.url_bar.setText(url)
            self.setWindowTitle(f"{browser.title()} - Epik Browser")

    def save_to_history(self, browser):
        current_url = browser.url().toString()
        self.history_list.addItem(current_url)

    def toggle_history(self):
        visible = self.history_dock.isVisible()
        self.history_dock.setVisible(not visible)

    def close_tab(self, index):
        if self.tabs.count() > 1:
            self.tabs.removeTab(index)

    def handle_download(self, download: QWebEngineDownloadItem):
        path, _ = QFileDialog.getSaveFileName(self, "Zapisz plik", download.path())
        if path:
            download.setPath(path)
            download.accept()
            QMessageBox.information(self, "Pobieranie", f"Pobieranie rozpoczęte:\n{path}")
        else:
            download.cancel()

    def enable_dark_mode(self):
        dark_palette = QPalette()
        dark_palette.setColor(QPalette.Window, QColor(30, 30, 30))
        dark_palette.setColor(QPalette.WindowText, Qt.white)
        dark_palette.setColor(QPalette.Base, QColor(25, 25, 25))
        dark_palette.setColor(QPalette.AlternateBase, QColor(53, 53, 53))
        dark_palette.setColor(QPalette.ToolTipBase, Qt.white)
        dark_palette.setColor(QPalette.ToolTipText, Qt.white)
        dark_palette.setColor(QPalette.Text, Qt.white)
        dark_palette.setColor(QPalette.Button, QColor(53, 53, 53))
        dark_palette.setColor(QPalette.ButtonText, Qt.white)
        dark_palette.setColor(QPalette.BrightText, Qt.red)
        dark_palette.setColor(QPalette.Link, QColor(42, 130, 218))
        dark_palette.setColor(QPalette.Highlight, QColor(42, 130, 218))
        dark_palette.setColor(QPalette.HighlightedText, Qt.black)
        QApplication.instance().setPalette(dark_palette)

    def load_start_page(self):
        if os.path.exists(START_PAGE_FILE):
            with open(START_PAGE_FILE, "r") as f:
                return f.read().strip()
        return "https://www.google.com"

    def set_start_page(self):
        url, ok = QInputDialog.getText(self, "Nowa strona startowa", "Podaj URL:")
        if ok and url:
            if not url.startswith("http"):
                url = "http://" + url
            with open(START_PAGE_FILE, "w") as f:
                f.write(url)
            QMessageBox.information(self, "Ustawiono", f"Strona startowa została zmieniona na:\n{url}")

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = SimpleBrowser()
    window.show()
    sys.exit(app.exec_())
