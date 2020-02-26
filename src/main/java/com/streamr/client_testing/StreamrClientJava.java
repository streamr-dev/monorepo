package com.streamr.client_testing;

import com.streamr.client.StreamrClient;
import com.streamr.client.rest.Stream;

public class StreamrClientJava extends StreamrClientWrapper {
    private final StreamrClient streamrClient;

    public StreamrClientJava(StreamrClient streamrClient) {
        this.streamrClient = streamrClient;
    }

    public StreamrClient getStreamrClient() {
        return streamrClient;
    }

    @Override
    public String getAddress() {
        return streamrClient.getPublisherId();
    }

    @Override
    public String getImplementation() {
        return "Java";
    }

    @Override
    public PublisherThread toPublisherThread(Stream stream, PublishFunction publishFunction, long interval) {
        return new PublisherThreadJava(stream, streamrClient, publishFunction, interval);
    }
}
