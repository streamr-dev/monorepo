package com.streamr.client_testing;

import com.streamr.client.rest.Stream;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.function.Consumer;

public class PublisherThreadJS extends PublisherThread {
    private final StreamrClientJS publisher;
    private Process p;
    private final String command;
    private Consumer<String> onPublished = null;
    private final Thread thread;

    public PublisherThreadJS(StreamrClientJS publisher, Stream stream, PublishFunction publishFunction, long interval) {
        super(interval);
        this.publisher = publisher;
        // We assume there is only 1 key since we test only 1 stream
        String groupKey = "";
        if (publisher.getEncryptionOptions() != null) {
            groupKey = publisher.getEncryptionOptions().getPublisherGroupKeys().values().iterator().next().getGroupKeyHex();
        }
        command = "node publisher.js " + publisher.getPrivateKey() + " " + stream.getId() + " "
                + publishFunction.getName() + " " + interval + " " + groupKey;
        thread = new Thread(this::executeNode);
    }

    @Override
    public String getPublisherId() {
        return publisher.getAddress();
    }

    @Override
    public void setOnPublished(Consumer<String> onPublished) {
        this.onPublished = onPublished;
    }

    @Override
    public void start() {
        thread.start();
    }

    private void executeNode() {
        try {
            p = Runtime.getRuntime().exec(command);
            BufferedReader stdInput = new BufferedReader(new
                    InputStreamReader(p.getInputStream()));

            BufferedReader stdError = new BufferedReader(new
                    InputStreamReader(p.getErrorStream()));

            String s;
            while (!Thread.currentThread().isInterrupted() && (s = stdInput.readLine()) != null) {
                if (s.startsWith("Published: ")) {
                    System.out.println(s);
                    if (onPublished != null) {
                        onPublished.accept(s.substring(12));
                    }
                } else {
                    System.out.println(s);
                }
            }
            while (!Thread.currentThread().isInterrupted() && (s = stdError.readLine()) != null) {
                System.out.println(s);
            }
            if (Thread.currentThread().isInterrupted()) {
                stdInput.close();
                stdError.close();
                p.destroy();
            }
        } catch (IOException e) {
            e.printStackTrace();
            System.exit(1);
        }
    }

    @Override
    public void stop() {
        thread.interrupt();
    }
}
