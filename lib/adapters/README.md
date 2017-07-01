# Adapters

Adapters wrap external APIs and allow us to consume these APIs in a fashion that's conventional in this library. For example, in this library we prefer to use Promises instead of callbacks. Adapters will wrap API calls that require callbacks to produce Promise based equivalent APIs.