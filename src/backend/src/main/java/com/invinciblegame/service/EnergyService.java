package com.invinciblegame.service;

import com.invinciblegame.domain.entity.User;
import com.invinciblegame.repository.UserRepository;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EnergyService {
    public static final int MAX_ENERGY = 5;
    public static final int ENERGY_COST_PER_BATTLE = 1;

    private final UserRepository userRepository;

    public EnergyService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Applies passive regeneration: +1 energy per full hour since {@link User#getLastEnergyUpdate()}, capped at {@link #MAX_ENERGY}.
     * When already full, refreshes the anchor so clients don't see a stale "next energy" time.
     */
    @Transactional
    public void syncRegeneration(User user) {
        User managed = userRepository.findById(user.getId()).orElseThrow();
        applyRegeneration(managed);
    }

    private void applyRegeneration(User user) {
        LocalDateTime now = LocalDateTime.now();
        if (user.getLastEnergyUpdate() == null) {
            user.setLastEnergyUpdate(now);
            userRepository.save(user);
            return;
        }

        int energy = user.getEnergy() == null ? 0 : user.getEnergy();
        if (energy >= MAX_ENERGY) {
            user.setEnergy(MAX_ENERGY);
            user.setLastEnergyUpdate(now);
            userRepository.save(user);
            return;
        }

        LocalDateTime anchor = user.getLastEnergyUpdate();
        long fullHours = ChronoUnit.HOURS.between(anchor, now);
        if (fullHours <= 0) {
            return;
        }

        int room = MAX_ENERGY - energy;
        int toAdd = (int) Math.min(fullHours, room);
        if (toAdd > 0) {
            user.setEnergy(energy + toAdd);
            user.setLastEnergyUpdate(anchor.plusHours(toAdd));
            userRepository.save(user);
        }
    }

    /** When energy &lt; max, time at which the next +1 is earned (1h after last applied regen tick). */
    public LocalDateTime computeNextEnergyAt(User user) {
        int energy = user.getEnergy() == null ? 0 : user.getEnergy();
        if (energy >= MAX_ENERGY) {
            return null;
        }
        if (user.getLastEnergyUpdate() == null) {
            return LocalDateTime.now().plusHours(1);
        }
        return user.getLastEnergyUpdate().plusHours(1);
    }

    @Transactional
    public void syncAllUsers() {
        userRepository.findAll().forEach(this::applyRegeneration);
    }
}
