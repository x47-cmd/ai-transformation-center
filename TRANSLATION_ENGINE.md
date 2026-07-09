# AI Transformation Center

# Translation Engine

Version 1.0

---

# Purpose

This document defines the multilingual architecture of the platform.

The platform must support Arabic and English from day one.

No text should be hardcoded inside HTML, CSS, or JavaScript pages.

---

# Supported Languages

Arabic

English

---

# Language Rules

Arabic uses RTL.

English uses LTR.

Language switching must happen instantly.

No page reload.

All modules must support both languages.

---

# Translation Source

All text must come from:

translations.js

---

# Translation Structure

translations = {

ar: {},

en: {}

}

---

# UI Text

Navigation labels

Buttons

Cards

Charts

Reports

Forms

Tables

Messages

Notifications

Errors

Tooltips

Modals

must all be translated.

---

# Direction Rules

Arabic

dir = rtl

lang = ar

English

dir = ltr

lang = en

---

# Number Formatting

Arabic

Arabic labels

AED formatting

Arabic dates

English

English labels

AED formatting

English dates

---

# Reports

All reports must support:

Arabic Report

English Report

PDF Export

PowerPoint Export

Print View

---

# Charts

Chart labels must change with language.

Chart legends must change with language.

Chart tooltips must change with language.

---

# Storage

Selected language is stored in:

atcSettingsV1

Default language:

Arabic

---

# Golden Rules

No hardcoded text.

Every text has translation key.

Every module supports RTL and LTR.

Every report supports Arabic and English.

Language is a core system feature, not an add-on.