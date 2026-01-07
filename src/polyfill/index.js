export default function ApplyPolyfills() {
  StringExtensions()
}

function StringExtensions() {
  if (!String.prototype.toUpperCaseFirst) {
    String.prototype.toUpperCaseFirst = function() {
      return this?.charAt(0)?.toUpperCase() + this?.slice(1) ?? ''
    }
  }
}

