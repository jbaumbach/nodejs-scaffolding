## Statistics ##

Implementations of various statistics. See [`lib/stats.js`](https://github.com/benschmaus/nodeload/tree/master/lib/stats.js).

**Classes:**

* `Histogram(numBuckets)`: A histogram of integers. If most of the items are between 0 and `numBuckets`, calculating percentiles and stddev is fast.
* `Accumulator`: Calculates the sum of the numbers put in.
* `ResultsCounter`: Tracks results which are be limited to a small set of possible choices. Tracks the total number of results, number of results by value, and results added per second.
* `Uniques`: Tracks the number of unique items added.
* `Peak`: Tracks the max of the numbers put in.
* `Rate`: Tracks the rate at which items are added.
* `LogFile`: Outputs to a file on disk.
* `NullLog`: Ignores all items put in.
* `Reportable`: Wraps any other statistic to store an interval and cumulative version of it.

**Functions:**

* `randomString(length)`: Returns a random string of ASCII characters between 32 and 126 of the requested length.
* `nextGaussian(mean, stddev)`: Returns a normally distributed number using the provided mean and standard deviation.
* `nextPareto(min, max, shape)`: Returns a Pareto distributed number between `min` and `max` inclusive using the provided shape.
* `roundRobin(list)`: Returns a copy of the list with a `get()` method. `get()` returns list entries round robin.

**Usage:**

All of the statistics classes support the methods:

* `.length`: The total number of items `put()` into this object.
* `put(item)`: Include an item in the statistic.
* `get()`: Get a specific value from the object, which varies depending on the object.
* `clear()`: Clear out all items.
* `summary()`: Get a object containing a summary of the object, which varies depending on the object. The fields returned are used to generate the trends of the HTML report graphs.

In addition, these other methods are supported:

* `Histogram.mean()`: Calculate the mean of the numbers in the histogram.
* `Histogram.percentile(percentile)`: Calculate the given `percentile`, between 0 and 1, of the numbers in the histogram.
* `Histogram.stddev()`: Standard deviation of the numbers in the histogram.
* `LogFile.open()`: Open the file.
* `LogFile.clear(text)`: Truncate the file, and write `text` if specified.
* `LogFile.close()`: Close the file.
* `Reportable.next()`: clear out the interval statistic for the next window.

Refer to the [`lib/stats.js`](https://github.com/benschmaus/nodeload/tree/master/lib/stats.js) for the return value of the `get()` and `summary()` functions for the different classes.