// @generated automatically by Diesel CLI.

diesel::table! {
    intent_events (id) {
        id -> Int4,
        event_type -> Text,
        package_id -> Text,
        module_name -> Text,
        sender -> Text,
        event_data -> Jsonb,
        checkpoint_sequence_number -> Int8,
        transaction_digest -> Text,
        created_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    transaction_digests (tx_digest) {
        tx_digest -> Text,
        checkpoint_sequence_number -> Int8,
    }
}

diesel::allow_tables_to_appear_in_same_query!(intent_events, transaction_digests,);
